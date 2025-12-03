import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.OSM_CLIENT_ID = 'test-client-id';
process.env.OSM_CLIENT_SECRET = 'test-client-secret';
process.env.OSM_ACCESS_TOKEN = 'test-access-token';
process.env.OSM_REFRESH_TOKEN = 'test-refresh-token';
process.env.OSM_TOKEN_EXPIRY = '9999999999999';
process.env.ALTCHA_SECRET_KEY = 'test-secret-key';
process.env.MAILJET_API_KEY = 'test-mailjet-key';
process.env.MAILJET_API_SECRET = 'test-mailjet-secret';
process.env.MAILJET_FROM_EMAIL = 'test@example.com';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/server', () => {
  class MockNextRequest {
    headers = new Map();
    private _body: any = null;
    
    constructor(url?: string | URL, init?: RequestInit) {
      this.headers.set('x-forwarded-for', '127.0.0.1');
      if (init?.body) {
        try {
          this._body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        } catch {
          this._body = null;
        }
      }
    }
    
    async json() {
      return this._body || {};
    }
  }
  
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
        ok: (init?.status || 200) < 400,
      }),
    },
  };
});

