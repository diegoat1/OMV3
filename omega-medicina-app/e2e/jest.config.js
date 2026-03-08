/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  testTimeout: 120000,
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'e2e/**/*.test.ts',
  ],
  coverageDirectory: 'coverage-e2e',
  verbose: true,
};
