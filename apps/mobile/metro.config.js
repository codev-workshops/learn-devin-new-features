// Metro config for the npm-workspaces monorepo.
// - `@kade/contracts` resolves to its TypeScript source so the app never depends on
//   `packages/contracts/dist` having been built first.
// - Native singletons (react, react-native, screens, safe-area) are pinned to this workspace's
//   copies: the root hoists newer versions for other packages and a second copy of React or a
//   codegen-incompatible react-native-screens would break the Android bundle.
const { getDefaultConfig } = require("expo/metro-config");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const contractsSource = path.join(workspaceRoot, "packages/contracts/src/index.ts");

const singletons = [
  "react",
  "react-native",
  "react-native-screens",
  "react-native-safe-area-context",
  "expo-modules-core",
  "expo-router",
  "expo-constants",
];

function localPackageDir(name) {
  const dir = path.join(projectRoot, "node_modules", name);
  return fs.existsSync(path.join(dir, "package.json")) ? dir : null;
}

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(workspaceRoot, "node_modules"),
];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@kade/contracts") {
    return { type: "sourceFile", filePath: contractsSource };
  }
  const pinned = singletons.find((n) => moduleName === n || moduleName.startsWith(`${n}/`));
  const local = pinned ? localPackageDir(pinned) : null;
  if (local) {
    const rewritten = path.join(local, moduleName.slice(pinned.length));
    return context.resolveRequest(
      { ...context, originModulePath: path.join(local, "package.json") },
      rewritten,
      platform,
    );
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
