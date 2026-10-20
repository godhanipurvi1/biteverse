import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Empty stub files make vitest fail ("No test suite found").
    // Delete a line here when you write that test file.
    exclude: [
      "**/node_modules/**",
      "tests/bundles.test.ts",
      "tests/builder.test.ts",
      "tests/half-and-half.test.ts",
      "tests/offers.test.ts",
      "tests/slots.test.ts",
      "tests/scoring.test.ts",
      "tests/guardrails.test.ts",
    ],
    passWithNoTests: true,
  },
});
