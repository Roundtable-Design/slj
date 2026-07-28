import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".staging-secrets.local" });

const password =
  process.env.STAGING_BASIC_AUTH_PASSWORD ?? process.env.STAGING_PASS ?? "";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "https://slj.round-table.co.uk",
    httpCredentials: {
      username: process.env.STAGING_BASIC_AUTH_USER ?? "slj",
      password,
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
