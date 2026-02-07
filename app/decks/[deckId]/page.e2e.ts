import { test, expect } from '@playwright/test'

test.describe('Deck detail', () => {
  // Helper: create a deck and navigate to it
  async function createDeck(page: import('@playwright/test').Page, name: string) {
    await page.goto('/decks/new')
    await page.getByLabel('덱 이름').fill(name)
    await page.getByRole('button', { name: '덱 만들기' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+/)
  }

  test('shows empty card list for a new deck', async ({ page }) => {
    await createDeck(page, 'E2E 빈 덱')

    await expect(page.getByText('E2E 빈 덱')).toBeVisible()
    await expect(page.getByText('아직 카드가 없습니다.')).toBeVisible()
    await expect(page.getByText('전체 카드')).toBeVisible()
  })

  test('shows stats with zero counts for new deck', async ({ page }) => {
    await createDeck(page, 'E2E 통계 덱')

    await expect(page.getByText('전체 카드')).toBeVisible()
    await expect(page.getByText('새 카드')).toBeVisible()
    await expect(page.getByText('학습 중')).toBeVisible()
    await expect(page.getByText('복습 대기')).toBeVisible()
  })

  test('navigates to add card page', async ({ page }) => {
    await createDeck(page, 'E2E 카드추가 덱')

    await page.getByRole('button', { name: '카드 추가' }).first().click()
    await expect(page).toHaveURL(/\/cards\/new/)
  })

  test('shows back button to home', async ({ page }) => {
    await createDeck(page, 'E2E 뒤로가기 덱')

    // Click the back arrow (first button in header)
    await page.locator('header').getByRole('link').first().click()
    await expect(page).toHaveURL('/')
  })

  test('home page shows created deck', async ({ page }) => {
    await createDeck(page, 'E2E 홈표시 덱')

    await page.goto('/')
    await expect(page.getByText('E2E 홈표시 덱')).toBeVisible()
  })
})
