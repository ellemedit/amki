import { test, expect } from '@playwright/test'

test.describe('Study session', () => {
  // Helper: create deck with cards and navigate to study
  async function setupStudySession(page: import('@playwright/test').Page) {
    // Create deck
    await page.goto('/decks/new')
    await page.getByLabel('덱 이름').fill('E2E 학습 테스트')
    await page.getByRole('button', { name: '덱 만들기' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+/)

    // Add cards
    await page.getByRole('button', { name: '카드 추가' }).first().click()

    await page.getByLabel('앞면 (질문)').fill('Hello')
    await page.getByLabel('뒷면 (답)').fill('안녕하세요')
    await page.getByRole('button', { name: '카드 추가' }).click()
    await expect(page.getByText('카드가 추가되었습니다')).toBeVisible()

    await page.getByLabel('앞면 (질문)').fill('Goodbye')
    await page.getByLabel('뒷면 (답)').fill('안녕히 가세요')
    await page.getByRole('button', { name: '카드 추가' }).click()
    await expect(page.getByText('2장 추가됨')).toBeVisible()

    // Go back to deck
    await page.getByRole('button', { name: '완료' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+$/)

    return page
  }

  test('shows study button with correct count', async ({ page }) => {
    await setupStudySession(page)

    // Should show study button with 2 due cards
    await expect(page.getByText(/학습 시작/)).toBeVisible()
    await expect(page.getByText(/2장/)).toBeVisible()
  })

  test('starts study session and shows question', async ({ page }) => {
    await setupStudySession(page)

    await page.getByText(/학습 시작/).click()
    await expect(page).toHaveURL(/\/study/)

    // Should show a question card
    await expect(page.getByText('질문')).toBeVisible()
    // Should show one of the card fronts
    const hasHello = await page.getByText('Hello').isVisible().catch(() => false)
    const hasGoodbye = await page.getByText('Goodbye').isVisible().catch(() => false)
    expect(hasHello || hasGoodbye).toBeTruthy()
  })

  test('can reveal answer and rate quality for basic card', async ({ page }) => {
    await setupStudySession(page)

    await page.getByText(/학습 시작/).click()
    await expect(page).toHaveURL(/\/study/)

    // Show answer
    await page.getByRole('button', { name: '답 보기' }).click()

    // Answer should be visible
    await expect(page.getByText('정답')).toBeVisible()

    // Quality rating buttons should be visible
    await expect(page.getByText('얼마나 잘 알고 있었나요?')).toBeVisible()
    await expect(page.getByText('완벽')).toBeVisible()
    await expect(page.getByText('좋음')).toBeVisible()
  })

  test('completes a full study session', async ({ page }) => {
    await setupStudySession(page)

    await page.getByText(/학습 시작/).click()
    await expect(page).toHaveURL(/\/study/)

    // Review card 1
    await page.getByRole('button', { name: '답 보기' }).click()
    await page.getByText('완벽').click()

    // Review card 2
    await page.getByRole('button', { name: '답 보기' }).click()
    await page.getByText('완벽').click()

    // Should show completion screen
    await expect(page.getByText('학습 완료!')).toBeVisible()
    await expect(page.getByText('2장의 카드를 복습했습니다')).toBeVisible()
  })

  test('can go back to deck from study session', async ({ page }) => {
    await setupStudySession(page)

    await page.getByText(/학습 시작/).click()
    await expect(page).toHaveURL(/\/study/)

    // Click back button
    await page.locator('header').getByRole('link').first().click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+$/)
  })

  test('shows no cards message when deck has no cards', async ({ page }) => {
    // Create empty deck
    await page.goto('/decks/new')
    await page.getByLabel('덱 이름').fill('E2E 빈 학습')
    await page.getByRole('button', { name: '덱 만들기' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+/)

    // Navigate to study URL directly
    const url = page.url()
    await page.goto(`${url}/study`)

    await expect(page.getByText('복습할 카드가 없습니다')).toBeVisible()
  })
})
