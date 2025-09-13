const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

// Mocks
const authMock = { auth: jest.fn() };

const prismaClientMock = {
  user: { findUnique: jest.fn() },
  question: {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
};

function loadRoute() {
  const filePath = path.resolve(__dirname, 'route.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const wrapper = `(function (exports, require, module, __filename, __dirname) { ${outputText} \n})`;
  const compiled = vm.runInThisContext(wrapper, { filename: filePath });
  const module = { exports: {} };
  function customRequire(p) {
    if (p === '@/lib/auth') return authMock;
    if (p === '@/lib/prisma') return { prisma: prismaClientMock };
    return require(p);
    }
  compiled(module.exports, customRequire, module, filePath, path.dirname(filePath));
  return module.exports;
}

describe('questions route pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses defaults when page and limit are missing', async () => {
    const { GET } = loadRoute();

    authMock.auth.mockResolvedValue({ user: { id: '1' } });
    prismaClientMock.user.findUnique.mockResolvedValue({ id: '1', plan: 'USER' });
    prismaClientMock.question.findMany.mockResolvedValue([]);
    prismaClientMock.question.count.mockResolvedValue(0);

    const req = { url: 'http://localhost/api/questions' };
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(prismaClientMock.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 })
    );
    const data = await res.json();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
  });

  it('defaults when page or limit are malformed', async () => {
    const { GET } = loadRoute();

    authMock.auth.mockResolvedValue({ user: { id: '1' } });
    prismaClientMock.user.findUnique.mockResolvedValue({ id: '1', plan: 'USER' });
    prismaClientMock.question.findMany.mockResolvedValue([]);
    prismaClientMock.question.count.mockResolvedValue(0);

    const req = { url: 'http://localhost/api/questions?page=foo&limit=-5' };
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(prismaClientMock.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 })
    );
    const data = await res.json();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
  });
});

