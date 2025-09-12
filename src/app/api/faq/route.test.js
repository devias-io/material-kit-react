const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { NextRequest } = require('next/server');

const mockFaqs = [
  {
    id: 1,
    content: 'Example content',
    question: { category: 'GENERAL' },
    admin: { firstName: 'John', lastName: 'Doe' },
    faqOrder: 0
  }
];

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      answer: {
        findMany: jest.fn().mockResolvedValue(mockFaqs)
      },
      $disconnect: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

function loadRoute() {
  const tsFile = fs.readFileSync(path.join(__dirname, 'route.ts'), 'utf8');
  const transpiled = ts.transpileModule(tsFile, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const module = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  fn(require, module, module.exports);
  return module.exports;
}

const { GET } = loadRoute();

describe('GET /api/faq', () => {
  it('returns FAQs without credentials', async () => {
    const req = new NextRequest('http://localhost/api/faq');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.faqs).toEqual(mockFaqs);
  });

  it('returns FAQs with credentials', async () => {
    const req = new NextRequest('http://localhost/api/faq', {
      headers: {
        'X-User-Email': 'user@example.com',
        Authorization: 'Bearer token'
      }
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.faqs).toEqual(mockFaqs);
  });
});
