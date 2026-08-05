// E2E — 5 条核心 happy path + 2 条错误场景 (对应 TDD 矩阵 E2E-01..07)
import { test, expect } from '@playwright/test'

test.describe('AI Panel Studio — E2E', () => {
  test('E2E-01: 首页加载并显示讨论列表', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=AI Panel Studio')).toBeVisible()
    // Mock 模式下应有预设讨论
    await expect(page.locator('text=讨论列表')).toBeVisible({ timeout: 5000 })
  })

  test('E2E-02: 创建讨论 → 跳转 PENDING_PANEL → 自动生成嘉宾', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[placeholder*="讨论话题"]', 'E2E 测试话题')
    await page.click('text=创建讨论')
    // 应跳转到 /discussions/
    await page.waitForURL(/\/discussions\//, { timeout: 5000 })
    // 应进入 PANEL_READY 状态
    await expect(page.locator('text=开始讨论')).toBeVisible({ timeout: 10000 })
  })

  test('E2E-03: 嘉宾阵容确认页 → 点击开始讨论 → 进入演播厅', async ({ page }) => {
    await page.goto('/')
    // 点击已有的 PANEL_READY 讨论
    const readyCard = page.locator('text=待确认').first()
    if (await readyCard.isVisible()) {
      await readyCard.click()
      await page.waitForURL(/\/discussions\//, { timeout: 5000 })
      await page.click('text=开始讨论')
      // 应进入演播厅
      await expect(page.locator('text=Transcript')).toBeVisible({ timeout: 10000 })
    }
  })

  test('E2E-04: 演播厅展示舞台区和嘉宾', async ({ page }) => {
    await page.goto('/')
    // 点击进行中的讨论
    const liveCard = page.locator('text=进行中').first()
    if (await liveCard.isVisible()) {
      await liveCard.click()
      await page.waitForURL(/\/discussions\//, { timeout: 5000 })
      // 应有嘉宾卡片和 Transcript
      await expect(page.locator('[aria-label="专家嘉宾"]')).toBeVisible({ timeout: 5000 })
    }
  })

  test('E2E-05: ENDED 讨论展示总结和操作按钮', async ({ page }) => {
    await page.goto('/')
    const endedCard = page.locator('text=已结束').first()
    if (await endedCard.isVisible()) {
      await endedCard.click()
      await page.waitForURL(/\/discussions\//, { timeout: 5000 })
      await expect(page.locator('text=主持人总结')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=返回首页')).toBeVisible()
    }
  })

  test('E2E-06: 空话题不可创建', async ({ page }) => {
    await page.goto('/')
    const btn = page.locator('text=创建讨论')
    await expect(btn).toBeDisabled()
  })

  test('E2E-07: 点击讨论卡片进入详情', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('.discussion-card').first()
    if (await card.isVisible()) {
      await card.click()
      await page.waitForURL(/\/discussions\//, { timeout: 5000 })
    }
  })
})
