const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.{js,jsx,ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^canvas$': '<rootDir>/tests/__mocks__/canvasMock.js'
  },
  setupFiles: ['<rootDir>/jest.setup.js']
};

module.exports = createJestConfig(customJestConfig);
