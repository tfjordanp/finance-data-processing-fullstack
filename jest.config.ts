import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.spec.ts', '**/test/**/*.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  clearMocks: true,
};
export default config;
