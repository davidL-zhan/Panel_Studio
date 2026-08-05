"""SDD 交付物要求 — >=5 条高质量样例数据"""
import asyncio, sys, io
sys.path.insert(0, ".")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from app.database import init_db, AsyncSessionLocal, Discussion, Panelist
from app.llm import assign_colors, HOST_COLOR

# 预设色板仅用于种子数据着色；生产环境由 LLM 场景 A 调用 assign_colors 分配
SEEDS = [
    {
        "topic": "AI 会取代人类创造力吗？",
        "expert_count": 5,
        "host": ("张明远", "科技媒体主编", "资深圆桌主持人", "中立主持"),
        "experts": [
            ("李思涵", "AI 研究员", "前 OpenAI 科学家", "AI 将极大拓展人类创造力边界"),
            ("王翰文", "当代艺术家", "中央美院教授", "创造力是人类独有的精神活动"),
            ("陈思远", "哲学家", "北大哲学系研究员", "创造力定义本身需要重新审视"),
            ("刘晓峰", "企业家", "某 AI 创业公司 CEO", "AI 是工具，创造力始终在人"),
            ("赵敏", "教育学家", "华东师大学前教育专家", "AI 应辅助而非替代创造性教育"),
        ],
    },
    {
        "topic": "2050 年的城市交通会是什么样？",
        "expert_count": 4,
        "host": ("周雅文", "财经节目主持人", "资深主持人", "中立主持"),
        "experts": [
            ("马丁", "城市规划师", "同济大学规划系主任", "立体交通网络是必然趋势"),
            ("林雪", "自动驾驶工程师", "Waymo 前技术负责人", "L5 自动驾驶将彻底改变出行"),
            ("Green", "环保主义者", "绿色交通倡导者", "零碳出行是底线而非选项"),
            ("钱伟", "经济学家", "社科院研究员", "成本效益决定技术落地速度"),
        ],
    },
    {
        "topic": "远程办公是未来还是过渡方案？",
        "expert_count": 6,
        "host": ("孙涛", "商业评论员", "资深主持人", "中立主持"),
        "experts": [
            ("吴芳", "HR 总监", "某跨国公司 CHRO", "混合办公是未来主流"),
            ("郑明", "组织心理学家", "中科院研究员", "远程办公对心理健康影响被低估"),
            ("黄丽", "企业管理顾问", "麦肯锡前合伙人", "数据驱动才能回答这个问题"),
            ("Alex", "远程办公倡导者", "Remote.com 创始人", "办公室是 20 世纪的遗产"),
            ("沈工", "办公空间设计师", "Gensler 设计总监", "空间应随工作方式进化"),
            ("冯总", "IT 基础设施专家", "某云厂商 VP", "技术已成熟，文化才是障碍"),
        ],
    },
    {
        "topic": "我们应该殖民火星吗？",
        "expert_count": 4,
        "host": ("林涛", "政经评论员", "资深主持人", "中立主持"),
        "experts": [
            ("赵宇航", "航天工程师", "中国航天科技集团研究员", "火星殖民是人类文明必然选择"),
            ("Emily", "伦理学家", "哈佛大学访问学者", "我们有道德义务先解决地球问题"),
            ("王凯", "经济学家", "北大光华管理学院教授", "火星殖民的投入产出比极不合理"),
            ("陈博士", "天体生物学家", "中科院研究员", "火星存在生命的可能性改变一切"),
        ],
    },
    {
        "topic": "全民基本收入（UBI）可行吗？",
        "expert_count": 5,
        "host": ("林涛", "政经评论员", "资深主持人", "中立主持"),
        "experts": [
            ("许教授", "经济学家", "北大光华管理学院教授", "UBI 在财政上不可持续"),
            ("白博士", "社会学家", "社科院研究员", "UBI 是社会公平的必要工具"),
            ("韩部长", "政策制定者", "前劳动部官员", "实施路径比理论更重要"),
            ("雷总", "科技企业家", "某 AI 公司创始人", "AI 时代 UBI 不可避免"),
            ("温代表", "劳工代表", "全国总工会顾问", "UBI 不能替代劳动保障"),
        ],
    },
]


async def run():
    await init_db()
    async with AsyncSessionLocal() as db:
        for s in SEEDS:
            disc = Discussion(topic=s["topic"], expert_count=s["expert_count"], status="PANEL_READY")
            db.add(disc)
            await db.flush()

            hname, hprof, htitle, hstance = s["host"]
            host = Panelist(
                discussion_id=disc.id, name=hname, role="HOST",
                profession=hprof, title=htitle, stance=hstance,
                color=HOST_COLOR, sort_order=0,
            )
            db.add(host)

            colors = assign_colors(s["expert_count"])
            for i, (ename, eprof, etitle, estance) in enumerate(s["experts"]):
                e = Panelist(
                    discussion_id=disc.id, name=ename, role="EXPERT",
                    profession=eprof, title=etitle, stance=estance,
                    color=colors[i], sort_order=i + 1,
                )
                db.add(e)

        await db.commit()
        print(f"[OK] Inserted {len(SEEDS)} seed discussions")


asyncio.run(run())
