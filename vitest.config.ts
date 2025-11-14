import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"], // Specifies the directory and filename rules for test files

    exclude: [
      ...configDefaults.exclude, // Includes default exclusion directories such as node_modules
      "dist/**", // Excludes the dist directory to avoid test output files
      "src/**/*.test.ts", // If you want to test only the source code files, and there are ts test files that you don't want to be tested, you can also exclude them
    ],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["dist/**", "node_modules/**", "tests/**"],
    },
  },
});
