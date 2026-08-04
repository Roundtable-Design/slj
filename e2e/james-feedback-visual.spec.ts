import { test, expect } from "@playwright/test";

test.describe("James feedback (layout + content)", () => {
  test("margin notes sit beside the reading column without shrinking it", async ({
    page,
  }) => {
    await page.goto("/course/09-session-one");
    const row = page.locator("[data-block-row]").first();
    await expect(row).toBeVisible();
    const text = row.locator(":scope > div").first();
    const textBox = await text.boundingBox();
    expect(textBox?.width ?? 0).toBeGreaterThan(480);
    const margin = row.locator(".margin-notes-column");
    if ((await margin.count()) > 0) {
      const box = await margin.first().boundingBox();
      expect(box?.width ?? 0).toBeLessThan(1280 / 3);
    }
  });

  test("introduction shows a single top-level title", async ({ page }) => {
    await page.goto("/course/07-introduction");
    await expect(page.locator("article h1")).toHaveCount(1);
  });

  test("foreword shows a single top-level title", async ({ page }) => {
    await page.goto("/course/06-foreword-summer-2004");
    await expect(page.locator("article h1")).toHaveCount(1);
  });

  test("introduction includes Further Reading subsection", async ({ page }) => {
    await page.goto("/course/07-introduction");
    await expect(
      page.getByRole("heading", { name: /Further Reading and Resources/i })
    ).toBeVisible();
  });

  test("session five footnote links to notes chapter", async ({ page }) => {
    await page.goto("/course/17-session-five");
    const footnote = page.getByRole("link", { name: "[38]", exact: true }).first();
    await expect(footnote).toBeVisible();
    await footnote.click();
    await expect(page).toHaveURL(/\/course\/29-references#note-38/);
    await expect(page.locator("#note-38")).toBeVisible();
  });

  test("budgeting worksheet shows Mrs R. E. Joyce example heading", async ({
    page,
  }) => {
    await page.goto("/worksheets/print/budgeting-money-audit");
    await expect(
      page.getByRole("heading", { name: /Looking after your personal money/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mrs R\. E\. Joyce/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "[51]" })
    ).toHaveAttribute("href", "/course/29-references#note-51");
  });

  test("full book shows one h1 for session one chapter", async ({ page }) => {
    await page.goto("/course/all");
    const section = page.locator('[id="09-session-one"]');
    await expect(section).toBeVisible();
    await expect(section.locator("h1")).toHaveCount(1);
  });

  test("session one links to Things to Change worksheet", async ({ page }) => {
    await page.goto("/course/09-session-one");
    await expect(
      page.getByRole("region", { name: /Things to Change worksheet/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open" }).first()
    ).toBeVisible();
  });

  test("things to change print view renders", async ({ page }) => {
    await page.goto("/worksheets/print/things-to-change");
    await expect(
      page.getByRole("heading", {
        name: /Steps I can take to move toward simplicity/i,
      })
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "THINGS TO CHANGE" })).toBeVisible();
  });

  test("notes panel aside is not used on chapter reader", async ({ page }) => {
    await page.goto("/course/09-session-one");
    await expect(
      page.locator('aside[aria-label="Notes"]')
    ).toHaveCount(0);
  });
});
