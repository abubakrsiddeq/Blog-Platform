import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Allow ts-jest to handle the project's tsconfig
        moduleResolution: 'node',
        esModuleInterop: true,
      },
    }],
    // Transform ESM-only JS/MJS files in node_modules (e.g. jsdom transitive deps)
    '^.+\\.m?js$': ['ts-jest', {
      tsconfig: {
        moduleResolution: 'node',
        esModuleInterop: true,
        allowJs: true,
      },
    }],
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  // jsdom v29 has many ESM-only transitive deps; allow Jest to transform them
  transformIgnorePatterns: [
    '/node_modules/(?!(@asamuzakjp/css-color|@asamuzakjp/generational-cache|@asamuzakjp/dom-selector|@csstools/css-calc|@csstools/css-color-parser|@csstools/color-helpers|@csstools/css-parser-algorithms|@csstools/css-tokenizer|@bramus/specificity|@exodus/bytes|css-tree|entities|parse5|tough-cookie)/)',
  ],
};

export default config;
