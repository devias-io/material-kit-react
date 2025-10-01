const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.{js,jsx,ts,tsx}']
};

module.exports = createJestConfig(customJestConfig);
