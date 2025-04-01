/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@libs/(.*)$': '<rootDir>/src/libs/$1',
  },
  silent: true,
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};
