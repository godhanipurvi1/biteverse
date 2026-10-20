// Stub test files stay excluded until they are written. Remove a line when its file has tests.
export default {
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "tests/bundles.test.ts",
      "tests/builder.test.ts",
      "tests/half-and-half.test.ts",
      "tests/offers.test.ts",
      "tests/scoring.test.ts",
      "tests/guardrails.test.ts",
    ],
  },
};
