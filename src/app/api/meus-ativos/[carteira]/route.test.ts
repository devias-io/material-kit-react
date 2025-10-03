import { NextRequest } from 'next/server';
import { GET } from './route';
import { auth } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}));

function createMockCarteiraData() {
  return [
    {
      id: 1,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      editadoEm: new Date('2024-01-03T00:00:00Z'),
      ticker: 'TEST3'
    },
    {
      id: 2,
      createdAt: new Date('2024-02-01T00:00:00Z'),
      updatedAt: new Date('2024-02-02T00:00:00Z'),
      editadoEm: new Date('2024-02-03T00:00:00Z'),
      ticker: 'TEST4'
    }
  ];
}

const mockCarteiraData = createMockCarteiraData();

jest.mock('@prisma/client', () => {
  const data = createMockCarteiraData();
  const prismaMock = {
    userMicroCaps: { findMany: jest.fn().mockResolvedValue(data) },
    userSmallCaps: { findMany: jest.fn().mockResolvedValue(data) },
    userDividendos: { findMany: jest.fn().mockResolvedValue(data) },
    userFiis: { findMany: jest.fn().mockResolvedValue(data) },
    userDividendosInternacional: { findMany: jest.fn().mockResolvedValue(data) },
    userEtfs: { findMany: jest.fn().mockResolvedValue(data) },
    userProjetoAmerica: { findMany: jest.fn().mockResolvedValue(data) },
    userExteriorStocks: { findMany: jest.fn().mockResolvedValue(data) }
  };

  return {
    PrismaClient: jest.fn(() => prismaMock)
  };
});

describe('GET /api/meus-ativos/[carteira]', () => {
  it('retorna todas as posições disponíveis para planos autorizados sem truncamento', async () => {
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
      user: {
        email: 'teste@fatosdabolsa.com',
        plan: 'VIP'
      }
    });

    const request = new NextRequest('http://localhost/api/meus-ativos/smallCaps');

    const response = await GET(request, { params: { carteira: 'smallCaps' } });
    const json = await response.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(mockCarteiraData.length);
    expect(json[0].ticker).toBe('TEST3');
  });
});
