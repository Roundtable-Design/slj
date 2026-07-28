import { test, expect } from "@playwright/test";

test.describe("Auth + Neon smoke", () => {
  test("landing shows sign-in entry point", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Simplicity Love & Justice", level: 1 })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("sign-in page loads email form", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send sign-in email" })
    ).toBeVisible();
  });

  test("e2e credentials sign-in reaches course home", async ({ page }) => {
    const secret = process.env.AUTH_E2E_SECRET;
    test.skip(!secret, "AUTH_E2E_SECRET not set");

    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel("E2E secret").fill(secret!);
    await page.getByRole("button", { name: "Sign in with test secret" }).click();
    await expect(page).toHaveURL(/\/($|\?)/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /Simplicity Love & Justice/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("authenticated user can open session and see note affordance", async ({
    page,
  }) => {
    const secret = process.env.AUTH_E2E_SECRET;
    test.skip(!secret, "AUTH_E2E_SECRET not set");

    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill(`e2e-notes-${Date.now()}@example.com`);
    await page.getByLabel("E2E secret").fill(secret!);
    await page.getByRole("button", { name: "Sign in with test secret" }).click();
    await page.waitForURL(/\/($|\?|course|progress)/, { timeout: 30_000 });

    await page.goto("/course/09-session-one");
    await expect(
      page.getByRole("heading", { name: "What Is Simplicity?" })
    ).toBeVisible();
    await expect(page.getByText("In this chapter")).toBeVisible();
  });
});
