import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const outDir = path.join(process.cwd(), ".artifacts", "staging-qa");
fs.mkdirSync(outDir, { recursive: true });

test.describe("Staging visual QA", () => {
  test("landing, sign-in, course, groups screenshots", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Simplicity Love & Justice", level: 1 })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "01-landing.png"),
      fullPage: true,
    });

    await page.goto("/auth/sign-in");
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "02-sign-in.png"),
      fullPage: true,
    });

    const secret = process.env.AUTH_E2E_SECRET;
    test.skip(!secret, "AUTH_E2E_SECRET missing");

    await page.getByLabel("Email").fill(`staging-qa-${Date.now()}@example.com`);
    await page.getByLabel("E2E secret").fill(secret!);
    await page.getByRole("button", { name: "Sign in with test secret" }).click();
    await page.waitForURL(/\/($|\?|course|progress)/, { timeout: 45_000 });
    await page.screenshot({
      path: path.join(outDir, "03-home-authenticated.png"),
      fullPage: true,
    });

    await page.goto("/course/09-session-one");
    await expect(
      page.getByRole("heading", { name: "What Is Simplicity?" })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "04-session-one.png"),
      fullPage: false,
    });

    await page.goto("/groups");
    await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "05-groups.png"),
      fullPage: true,
    });
  });
});
