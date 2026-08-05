# 05 — LLM 输出校验层

> SDD 阶段 · 非确定性输出防御 · AI Panel Studio
>
> 前置依赖：`04-llm-protocol.md` §2.2

---

## 1. 设计原则

```
永不信任 LLM 输出 → 校验 → 重试（注入错误上下文） → 降级
```

| 原则 | 说明 |
|------|------|
| **所有字段必校验** | 类型、范围、引用完整性、必填字段存在性 |
| **大小写标准化** | 枚举值统一转大写后匹配 |
| **校验失败即重试** | 将校验错误信息注入重试 prompt，最多 1 次 |
| **重试仍失败则降级** | 按 `04-llm-protocol.md` §2.3 错误处理策略执行 |

---

## 2. 场景 A：嘉宾阵容生成

### 校验规则

```python
def validate_panel_generation(output: dict, expert_count: int) -> list[str]:
    errors = []

    # 顶层结构
    if "host" not in output:
        errors.append("缺少 host 字段")
    if "experts" not in output:
        errors.append("缺少 experts 字段")
    if errors:
        return errors

    host = output["host"]
    experts = output["experts"]

    # 主持人必填字段
    for field in ["name", "profession", "title", "stance"]:
        if not host.get(field):
            errors.append(f"host.{field} 缺失或为空")

    # 专家数量校验
    if len(experts) != expert_count:
        errors.append(f"experts 数组长度={len(experts)}，期望={expert_count}")

    # 每位专家必填字段
    for i, expert in enumerate(experts):
        for field in ["name", "profession", "title", "stance"]:
            if not expert.get(field):
                errors.append(f"experts[{i}].{field} 缺失或为空")

    # 专家姓名唯一性
    names = [e.get("name") for e in experts]
    if len(names) != len(set(names)):
        errors.append("专家姓名重复")

    # 立场多样性（软校验：警告但不阻断）
    stances = [e.get("stance") for e in experts]
    if len(set(stances)) < len(stances) / 2:
        # 超过半数专家立场相同 → 警告
        pass  # 软校验，不阻断

    return errors
```

---

## 3. 场景 B：讨论回合推进

### 校验规则

```python
def validate_turn_response(
    output: dict,
    known_panelist_ids: set[str],
    enum_message_types: set[str],
    enum_panelist_statuses: set[str],
) -> list[str]:
    errors = []

    # speaker_id 引用完整性 ← 最关键校验
    speaker_id = output.get("speaker_id")
    if not speaker_id:
        errors.append("缺少 speaker_id")
    elif speaker_id not in known_panelist_ids:
        errors.append(f"speaker_id={speaker_id} 不在已知嘉宾列表中（幻觉 UUID）")

    # content 必填且非空
    content = output.get("content", "")
    if not content or not content.strip():
        errors.append("content 缺失或为空")

    # message_type 枚举校验
    msg_type = output.get("message_type", "").upper()
    if msg_type not in enum_message_types:
        errors.append(f"message_type={msg_type} 不在允许值 {enum_message_types} 中")

    # panelist_statuses 覆盖完整性
    statuses = output.get("panelist_statuses", [])
    status_ids = {s.get("panelist_id") for s in statuses}
    missing = known_panelist_ids - status_ids
    extra = status_ids - known_panelist_ids

    if missing:
        errors.append(f"panelist_statuses 遗漏嘉宾: {missing}")
    if extra:
        errors.append(f"panelist_statuses 含未知嘉宾（幻觉 UUID）: {extra}")

    # 发言人 status 必须为 SPEAKING
    speaker_status = next(
        (s for s in statuses if s.get("panelist_id") == speaker_id), None
    )
    if speaker_status and speaker_status.get("status", "").upper() != "SPEAKING":
        errors.append(f"发言人 {speaker_id} 的 status 不是 SPEAKING")

    # 每个 status entry 需含有效 status 值
    for s in statuses:
        st = s.get("status", "").upper()
        if st not in enum_panelist_statuses:
            errors.append(f"panelist_statuses[{s.get('panelist_id')}].status={st} 无效")

    return errors
```

### 重试 Prompt 注入

校验失败时将错误列表注入下一次重试的 User Message 末尾：

```text
⚠️ 上一次输出校验失败，错误如下：
- speaker_id=abc123 不在已知嘉宾列表中（幻觉 UUID）
- panelist_statuses 遗漏嘉宾: {'uuid-of-missing-expert'}
请修正后重新输出。务必确保所有 ID 来自上述嘉宾列表。
```

---

## 4. 场景 C：共识/分歧提炼

### 校验规则

```python
def validate_consensus_extraction(output: dict) -> list[str]:
    errors = []

    points = output.get("points")
    if not isinstance(points, list):
        errors.append("points 不是数组")
        return errors

    for i, point in enumerate(points):
        # type 枚举校验（大小写标准化）
        pt = point.get("type", "").upper()
        if pt not in ("CONSENSUS", "DISAGREEMENT"):
            errors.append(f"points[{i}].type={pt} 无效，期望 CONCENSUS 或 DISAGREEMENT")

        # content 必填
        if not point.get("content"):
            errors.append(f"points[{i}].content 缺失或为空")

        # content 长度限制
        if len(point.get("content", "")) > 200:
            errors.append(f"points[{i}].content 超过 200 字限制")

    return errors
```

> 注：LLM 输出字段名是 `type`，数据库存储字段名是 `point_type`。处理层负责映射：`point_type = llm_output["type"].upper()`。

---

## 5. 场景 D：主持人总结

### 校验规则

纯文本输出，无需 JSON schema 校验。仅做基础质量检查：

```python
def validate_summary(text: str) -> list[str]:
    errors = []

    if not text or not text.strip():
        errors.append("总结文本为空")
    elif len(text) < 50:
        errors.append(f"总结过短（{len(text)} 字），期望 ≥50 字")
    elif len(text) > 600:
        errors.append(f"总结过长（{len(text)} 字），期望 ≤600 字")

    return errors
```

---

## 6. 场景 E：单个替代专家生成

### 校验规则

与场景 A 的单个专家校验一致，额外增加：

```python
def validate_replacement_expert(
    output: dict,
    existing_names: set[str],
) -> list[str]:
    errors = []

    for field in ["name", "profession", "title", "stance"]:
        if not output.get(field):
            errors.append(f"{field} 缺失或为空")

    # 姓名不能与已有专家重复
    if output.get("name") in existing_names:
        errors.append(f"name={output['name']} 与已有专家重名")

    return errors
```

---

## 7. 通用工具函数

### 枚举大小写标准化

```python
def normalize_enum(value: str, valid_set: set[str]) -> str | None:
    """将 LLM 返回的枚举值标准化。返回 None 表示无效值。"""
    upper = value.strip().upper()
    return upper if upper in valid_set else None
```

### 引用完整性检查

```python
def validate_reference(value: str, valid_ids: set[str], label: str) -> str | None:
    """校验外键引用。返回 None 表示通过，否则返回错误描述。"""
    if value not in valid_ids:
        return f"{label}={value} 不在已知 ID 列表中（可能是 LLM 幻觉）"
    return None
```

---

## 8. 非确定性规则的近似测试标准

以下规则因依赖 LLM 输出本质不可精确验证，定义近似标准用于 TDD 阶段的"软断言"（警告而非阻断）： [→ m-10 修复]

| 规则 | 近似验证标准 | 软断言阈值 |
|------|-------------|-----------|
| "每次发言 1–2 句" | 按中文句号/问号/感叹号分割，计数 | ≤ 4 句通过；> 4 句警告 |
| "禁止机械轮流发言" | 统计相邻 N 条消息的发言人分布熵值 | 熵值 < 0.5（高度规律）→ 警告 |
| "至少 2 组对立立场" | 将 stance 文本两两送入简单的对立关键词检测 | ≥ 1 组对立 → 通过 |
| "共识提炼去重" | Jaccard 相似度（基于 jieba 分词） | ≥ 0.6 视为重复 |
