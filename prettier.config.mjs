/** @type {import('prettier').Config} */
const config = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 120,
  importOrder: [
    '^node:$',
    '',
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/types$',
    '^@/types/(.*)$',
    '^@/config$',
    '^@/config/(.*)$',
    '^@/paths$',
    '^@/data/(.*)$',
    '^@/lib/(.*)$',
    '^@/actions/(.*)$',
    '^@/contexts/(.*)$',
    '^@/hooks/(.*)$',
    '^@/components/(.*)$',
    '^@/styles/(.*)$',
    '',
    '^[./]',
  ],
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
};

export default config;
