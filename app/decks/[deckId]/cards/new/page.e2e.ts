import { test, expect } from '@playwright/test'

test.describe('Add cards', () => {
  // Helper: create a deck and go to add card page
  async function goToAddCard(page: import('@playwright/test').Page) {
    await page.goto('/decks/new')
    await page.getByLabel('덱 이름').fill('E2E 카드 테스트 덱')
    await page.getByRole('button', { name: '덱 만들기' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+/)

    await page.getByRole('button', { name: '카드 추가' }).first().click()
    await expect(page).toHaveURL(/\/cards\/new/)
  }

  test('can add a basic card', async ({ page }) => {
    await goToAddCard(page)

    await page.getByLabel('앞면 (질문)').fill('Apple')
    await page.getByLabel('뒷면 (답)').fill('사과')
    await page.getByRole('button', { name: '카드 추가' }).click()

    // Should show success toast
    await expect(page.getByText('카드가 추가되었습니다')).toBeVisible()
    await expect(page.getByText('1장 추가됨')).toBeVisible()
  })

  test('can add multiple cards in sequence', async ({ page }) => {
    await goToAddCard(page)

    // First card
    await page.getByLabel('앞면 (질문)').fill('Dog')
    await page.getByLabel('뒷면 (답)').fill('개')
    await page.getByRole('button', { name: '카드 추가' }).click()
    await expect(page.getByText('1장 추가됨')).toBeVisible()

    // Second card
    await page.getByLabel('앞면 (질문)').fill('Cat')
    await page.getByLabel('뒷면 (답)').fill('고양이')
    await page.getByRole('button', { name: '카드 추가' }).click()
    await expect(page.getByText('2장 추가됨')).toBeVisible()
  })

  test('can select subjective card type', async ({ page }) => {
    await goToAddCard(page)

    // Change type to subjective
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: /주관식/ }).click()

    await page.getByLabel('앞면 (질문)').fill('리액트의 핵심 개념은?')
    await page.getByLabel('뒷면 (답)').fill('컴포넌트 기반 UI 라이브러리')
    await page.getByRole('button', { name: '카드 추가' }).click()

    await expect(page.getByText('카드가 추가되었습니다')).toBeVisible()
  })

  test('done button navigates back to deck', async ({ page }) => {
    await goToAddCard(page)

    await page.getByRole('button', { name: '완료' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+$/)
  })

  test('cards appear in deck detail after adding', async ({ page }) => {
    await goToAddCard(page)

    await page.getByLabel('앞면 (질문)').fill('Banana')
    await page.getByLabel('뒷면 (답)').fill('바나나')
    await page.getByRole('button', { name: '카드 추가' }).click()
    await expect(page.getByText('카드가 추가되었습니다')).toBeVisible()

    // Go back to deck
    await page.getByRole('button', { name: '완료' }).click()
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+$/)

    // Card should be listed
    await expect(page.getByText('Banana')).toBeVisible()
    await expect(page.getByText('바나나')).toBeVisible()
    await expect(page.getByText('카드 목록 (1)')).toBeVisible()
  })
})
