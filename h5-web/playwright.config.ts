import { defineConfig } from "@playwright/test";

const viewports = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-414", width: 414, height: 896 },
  { name: "mobile-430", width: 430, height: 932 },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium", isMobile: true, hasTouch: true },
  projects: viewports.map((viewport) => ({
    name: viewport.name,
    use: { viewport: { width: viewport.width, height: viewport.height } },
  })),
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
