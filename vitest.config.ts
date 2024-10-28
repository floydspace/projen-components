import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      enabled: true,
      reporter: ["json", "lcov", "clover", "cobertura", "text"],
      include: ["src/**/*.?(c|m)[jt]s?(x)"],
    },
    reporters: ["default", ["junit", { outputFile: "test-reports/junit.xml" }]],
  },
});
