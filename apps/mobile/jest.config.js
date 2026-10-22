// jest-expo preset, widened for the monorepo: msw ships ESM (.mjs) deps that must be transformed,
// and `react` must resolve to the copy this workspace sees (local when pnpm nests it, else the
// hoisted root copy) so React and the renderer never come from two installs.
const path = require("node:path");
const preset = require("jest-expo/jest-preset");
const reactDir = path.dirname(require.resolve("react/package.json", { paths: [__dirname] }));

const babelTransform = preset.transform["\\.[jt]sx?$"];
const esmPackages = [
  "msw",
  "@mswjs/.*",
  "@open-draft/.*",
  "rettime",
  "until-async",
  "outvariant",
  "strict-event-emitter",
  "is-node-process",
  "@bundled-es-modules/.*",
  "statuses",
  "path-to-regexp",
  "tough-cookie",
  "headers-polyfill",
  "graphql",
];

module.exports = {
  ...preset,
  rootDir: __dirname,
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testMatch: ["<rootDir>/test/**/*.test.ts", "<rootDir>/test/**/*.test.tsx"],
  moduleFileExtensions: [
    ...new Set([...(preset.moduleFileExtensions ?? []), "mjs", "ts", "tsx", "js", "json"]),
  ],
  transform: {
    ...preset.transform,
    "\\.m?[jt]sx?$": babelTransform,
  },
  transformIgnorePatterns: [
    `node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|${esmPackages.join("|")})`,
  ],
  moduleNameMapper: {
    ...(preset.moduleNameMapper ?? {}),
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@harbourline/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
    "^react$": reactDir,
    "^react/(.*)$": `${reactDir}/$1`,
  },
  testEnvironmentOptions: {
    ...(preset.testEnvironmentOptions ?? {}),
    customExportConditions: [""],
  },
};
