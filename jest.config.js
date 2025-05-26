module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'apps',
  testRegex: '.*\\.(spec|test)\\.ts$',
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
    '!**/index.ts',
    '!**/*.e2e.test.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', __dirname],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/api/src/$1',
    '^@doc/(.*)$': '<rootDir>/process-document-job/src/$1',
  },
  maxWorkers: 3,
};
