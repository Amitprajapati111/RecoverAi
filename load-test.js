import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';
const TOKEN = __ENV.TOKEN;

export default function () {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  const res = http.get(`${BASE_URL}/api/dashboard`, {
    headers,
  });

  check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response is success': (r) => {
      try {
        return r.json('success') === true;
      } catch {
        return false;
      }
    },
  });

  sleep(0.1);
}