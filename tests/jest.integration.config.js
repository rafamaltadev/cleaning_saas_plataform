/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/integration/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  setupFiles: ['<rootDir>/support/load-env.ts'],
};
