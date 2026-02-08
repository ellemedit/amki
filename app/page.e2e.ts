import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("shows header and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Amki")).toBeVisible();
    await expect(page.getByText("간격 반복 학습")).toBeVisible();
    await expect(page.getByText("새 덱 만들기").first()).toBeVisible();
  });

  test("has a link to create new deck", async ({ page }) => {
    await page.goto("/");
    await page.getByText("새 덱 만들기").first().click();
    await expect(page).toHaveURL("/decks/new");
  });
});
