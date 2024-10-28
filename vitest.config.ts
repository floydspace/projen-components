import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["{src,test}/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    coverage: {
      enabled: true,
      reporter: ["json", "lcov", "clover", "cobertura", "text"],
      include: ["src/**/*.?(c|m)[jt]s?(x)"],
    },
    reporters: ["default", ["junit", { outputFile: "test-reports/junit.xml" }]],
  },
});
