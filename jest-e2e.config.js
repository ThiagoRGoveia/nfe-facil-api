module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'apps',
  testRegex: '.*\\.e2e.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/infra/**',
    '!**/*.enum.ts',
    '!**/graphql/models/**',
    '!**/graphql/inputs/**',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage-e2e',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', __dirname],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/api/src/$1',
    '^@doc/(.*)$': '<rootDir>/process-document-job/src/$1',
  },
  maxWorkers: 3,
  globalSetup: '<rootDir>/_scripts/jestGlobalSetup.ts',
  forceExit: true,
  detectOpenHandles: true,
}; 