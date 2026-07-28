import { test, expect } from "@playwright/test";

test.describe("Groups (authenticated)", () => {
  test("create group and edit shared notes", async ({ page }) => {
    const secret = process.env.AUTH_E2E_SECRET;
    test.skip(!secret, "AUTH_E2E_SECRET not set");

    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill(`e2e-group-${Date.now()}@example.com`);
    await page.getByLabel("E2E secret").fill(secret!);
    await page.getByRole("button", { name: "Sign in with test secret" }).click();
    await page.waitForURL(/\/($|\?|course|progress)/, { timeout: 30_000 });

    await page.goto("/groups");
    await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible();

    const name = `E2E Group ${Date.now()}`;
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Create group" }).click();
    await expect(page.getByRole("heading", { name })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel(/Group notes/).fill("Staging shared note");
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });
  });
});
