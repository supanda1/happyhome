module.exports = {
  preset: 'jest-expo',
  projects: [
    {
      displayName: 'Engineer App',
      testMatch: ['<rootDir>/apps/engineer-app/**/*.(test|spec).(ts|tsx|js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/apps/engineer-app/jest-setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/apps/engineer-app/src/$1',
        '^@household-services/shared$': '<rootDir>/packages/shared/src',
        '^@household-services/ui-kit$': '<rootDir>/packages/ui-kit/src',
      },
    },
    {
      displayName: 'Customer App',
      testMatch: ['<rootDir>/apps/customer-app/**/*.(test|spec).(ts|tsx|js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/apps/customer-app/jest-setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/apps/customer-app/src/$1',
        '^@household-services/shared$': '<rootDir>/packages/shared/src',
        '^@household-services/ui-kit$': '<rootDir>/packages/ui-kit/src',
      },
    },
    {
      displayName: 'Shared Package',
      testMatch: ['<rootDir>/packages/shared/**/*.(test|spec).(ts|tsx|js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/packages/shared/jest-setup.js'],
    },
    {
      displayName: 'UI Kit Package',
      testMatch: ['<rootDir>/packages/ui-kit/**/*.(test|spec).(ts|tsx|js|jsx)'],
      setupFilesAfterEnv: ['<rootDir>/packages/ui-kit/jest-setup.js'],
    },
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};