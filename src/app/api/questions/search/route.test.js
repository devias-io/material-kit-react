const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

// Mock auth
const authMock = { auth: jest.fn() };

// Mock Prisma client and expose real Prisma for sql tag
const actualPrisma = require('@prisma/client');
const prismaClientMock = {
  user: { findUnique: jest.fn() },
  $queryRaw: jest.fn(),
};
const prismaModuleMock = {
  PrismaClient: jest.fn(() => prismaClientMock),
  Prisma: actualPrisma.Prisma,
};

function loadRoute() {
  const filePath = path.resolve(__dirname, 'route.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  });
  const wrapper = `(function (exports, require, module, __filename, __dirname) { ${outputText} \n})`;
  const compiled = vm.runInThisContext(wrapper, { filename: filePath });
  const module = { exports: {} };
  function customRequire(p) {
    if (p === '@/lib/auth') return authMock;
    if (p === '@prisma/client') return prismaModuleMock;
    return require(p);
  }
  compiled(module.exports, customRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

describe('search route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parameterizes category filter', async () => {
    const { GET } = loadRoute();
    authMock.auth.mockResolvedValue({ user: { id: '1' } });
    prismaClientMock.user.findUnique.mockResolvedValue({ id: '1', plan: 'ADMIN' });
    // question results and totalQuestions
    prismaClientMock.$queryRaw.mockResolvedValueOnce([]);
    prismaClientMock.$queryRaw.mockResolvedValueOnce([{ count: 0 }]);

    const req = { url: 'http://localhost/api/questions/search?q=test&category=STOCK' };
    await GET(req);

    const sqlObj = prismaClientMock.$queryRaw.mock.calls[0][0];
    expect(sqlObj.values).toContain('STOCK');
    expect(sqlObj.sql).not.toMatch(/STOCK/);
  });
});
