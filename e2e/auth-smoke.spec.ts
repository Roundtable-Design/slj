import { test, expect } from "@playwright/test";

test.describe("Auth smoke", () => {
  test("landing shows sign-in entry point", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Simplicity Love & Justice", level: 1 })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /info@talksfromthewarehouse\.co\.uk/i })
    ).toHaveAttribute("href", /mailto:info@talksfromthewarehouse\.co\.uk/);
  });

  test("course content is readable in e2e smoke mode", async ({ page }) => {
    await page.goto("/course/09-session-one");
    await expect(page).toHaveURL(/\/course\/09-session-one/);
    await expect(
      page.getByRole("heading", { name: "What Is Simplicity?" })
    ).toBeVisible();
  });

  test("sign-in page loads email form", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Talks from the Warehouse/i })
    ).toHaveAttribute("href", "https://talksfromthewarehouse.co.uk");
    await expect(
      page.getByRole("link", { name: /info@talksfromthewarehouse\.co\.uk/i })
    ).toHaveAttribute("href", /mailto:info@talksfromthewarehouse\.co\.uk/);
  });

  test("sign-up page loads name and email fields", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page.getByLabel(/First name/i)).toBeVisible();
    await expect(page.getByLabel(/Last name/i)).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("sign-in page links to create account", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(
      page.getByRole("link", { name: "Create an account" })
    ).toHaveAttribute("href", /\/auth\/sign-up/);
  });

  test("course sidebar links to Talks from the Warehouse", async ({ page }) => {
    await page.goto("/course/09-session-one");
    const link = page
      .getByRole("complementary")
      .getByRole("link", { name: /Talks from the Warehouse/i });
    await expect(link).toHaveAttribute("href", "https://talksfromthewarehouse.co.uk");
  });
});
