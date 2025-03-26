const esModules = ['@angular'].join('|');

/**
 * @type {import('@jest/types').Config.InitialOptions}
 **/
module.exports = {
  transformIgnorePatterns: [`node_modules/(?!(${esModules})/)`],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.spec.json',
        isolatedModules: true,
        diagnostics: false,
        allowSyntheticDefaultImports: true,
      },
    ],
    '^.+\\.js$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest', // Transform ES Modules with Babel
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageProvider: 'v8',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'jsdom',
  coverageReporters: ['html'],
  // setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html', 'json'],
};
