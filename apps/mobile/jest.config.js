// jest-expo preset, widened for the monorepo: msw ships ESM (.mjs) deps that must be transformed,
// and `react` must resolve to this workspace's copy (the root hoists a newer React for other packages).
const preset = require("jest-expo/jest-preset");

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
    "^@kade/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
    "^react$": "<rootDir>/node_modules/react",
    "^react/(.*)$": "<rootDir>/node_modules/react/$1",
  },
  testEnvironmentOptions: {
    ...(preset.testEnvironmentOptions ?? {}),
    customExportConditions: [""],
  },
};
