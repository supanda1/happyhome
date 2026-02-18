const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Add support for workspace packages
config.resolver.alias = {
  '@household-services/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
  '@household-services/ui-kit': path.resolve(workspaceRoot, 'packages/ui-kit/src'),
};

// 5. Ensure we resolve the correct React Native version
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;