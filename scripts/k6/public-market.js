import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '3m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
  },
};

function assertOk(response) {
  check(response, {
    'status 200': r => r.status === 200,
  });
}

export default function () {
  group('market data', () => {
    const response = http.get(`${BASE_URL}/api/financial/market-data`);
    assertOk(response);
  });

  group('international data', () => {
    const response = http.get(`${BASE_URL}/api/financial/international-data`);
    assertOk(response);
  });

  group('brapi quote', () => {
    const response = http.get(`${BASE_URL}/api/brapi/quote?tickers=PETR4,VALE3,ITUB4`);
    assertOk(response);
  });

  group('brapi list', () => {
    const response = http.get(`${BASE_URL}/api/brapi/quote/list?type=stock`);
    assertOk(response);
  });

  sleep(1);
}
