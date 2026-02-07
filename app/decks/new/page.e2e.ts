import { test, expect } from "@playwright/test";

test.describe("Create deck", () => {
  test("creates a new deck and redirects to deck detail", async ({ page }) => {
    await page.goto("/decks/new");

    await expect(page.getByText("새 덱 만들기")).toBeVisible();
    await expect(page.getByLabel("덱 이름")).toBeVisible();

    await page.getByLabel("덱 이름").fill("테스트 영어 단어");
    await page.getByLabel("설명").fill("영어 기초 단어 학습용 덱");
    await page.getByRole("button", { name: "덱 만들기" }).click();

    // Should redirect to deck detail page
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+/);
    await expect(page.getByText("테스트 영어 단어")).toBeVisible();
    await expect(page.getByText("영어 기초 단어 학습용 덱")).toBeVisible();
  });

  test("shows deck name as required field", async ({ page }) => {
    await page.goto("/decks/new");

    const nameInput = page.getByLabel("덱 이름");
    await expect(nameInput).toHaveAttribute("required");
  });

  test("cancel button navigates back to home", async ({ page }) => {
    await page.goto("/decks/new");
    await page.getByRole("button", { name: "취소" }).click();
    await expect(page).toHaveURL("/");
  });
});
