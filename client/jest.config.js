const esModules = ['@angular', '@ngxs'].join('|');

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
    '^.+\\.mjs$': 'babel-jest',
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageProvider: 'v8',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'jsdom',
  coverageReporters: ['html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html', 'json'],
};
