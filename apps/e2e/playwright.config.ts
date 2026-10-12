import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./tests/fixtures.js";

const SERVER_PORT = 8001;
const PREVIEW_PORT = 4173;
const SERVER_ORIGIN = `http://localhost:${SERVER_PORT}`;
const PREVIEW_ORIGIN = `http://localhost:${PREVIEW_PORT}`;

const E2E_DATABASE_URL =
  "mongodb://localhost:27017/audiophile-e2e?replicaSet=rs0&directConnection=true";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  globalTimeout: 15 * 60 * 1000,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: PREVIEW_ORIGIN,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      name: "server",
      command: "node dist/index.js",
      cwd: "../server",
      url: `${SERVER_ORIGIN}/api/v1/health`,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        PORT: String(SERVER_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        JWT_SECRET: "e2e-secret-that-is-at-least-32-characters",
        JWT_EXPIRES_IN: "1d",
        JWT_COOKIE_EXPIRES_IN: "1",
        MEDIA_BASE_URL: "https://audiophile-media.t-bendet.com",
      },
    },
    {
      name: "client",
      command: "pnpm exec vite preview",
      cwd: "../client",
      url: PREVIEW_ORIGIN,
      reuseExistingServer: false,
      env: {
        VITE_APP_PORT: String(PREVIEW_PORT),
        VITE_APP_API_PROXY_TARGET: SERVER_ORIGIN,
      },
    },
  ],
});
