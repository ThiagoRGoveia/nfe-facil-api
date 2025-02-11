module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.(spec|test)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts', // Include all JavaScript and TypeScript files
    '!**/infra/**', // Exclude all files in the infra folder
    '!**/*.enum.ts',
    '!**/graphql/models/**',
    '!**/graphql/inputs/**',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', __dirname],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  maxWorkers: 5,
};
