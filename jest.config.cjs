/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  // Tests read TEMPLATES_DIR (an absolute path) from the repo root .env, same
  // as the server and the scripts do.
  setupFiles: ["dotenv/config"],
  // frontend/ is React + .tsx; the swc parser below is configured for plain
  // TypeScript and the environment is node, so its tests (when there are any)
  // need their own runner. server/*.test.ts, on the other hand, is picked up
  // by this config as-is.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/frontend/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: { parser: { syntax: "typescript" }, target: "es2022" },
        module: { type: "commonjs" },
      },
    ],
  },
};
