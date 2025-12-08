import { vi } from 'vitest';

export interface MockSubmission {
  id: string;
  status: string;
  businessName: string;
  description?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  duplicateOsmId?: string | null;
  duplicateOsmType?: string | null;
  duplicateMatches?: any[] | null;
  userEmail?: string;
  [key: string]: any;
}

export interface MockOSMResponse {
  nodeId?: number;
  wayId?: number;
  changesetId?: number;
  version?: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  nodes?: number[];
}

export interface MockOverpassResponse {
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;
}

/**
 * Create a mock submission object
 */
export function createMockSubmission(overrides: Partial<MockSubmission> = {}): MockSubmission {
  return {
    id: 'test-submission-id',
    status: 'pending',
    businessName: 'Test Business',
    description: 'Test description',
    category: 'shop=cafe',
    latitude: -37.8136,
    longitude: 144.9631,
    duplicateOsmId: null,
    duplicateOsmType: null,
    duplicateMatches: null,
    userEmail: 'test@example.com',
    ...overrides,
  };
}

/**
 * Create a mock OSM API response
 */
export function createMockOSMResponse(overrides: Partial<MockOSMResponse> = {}): MockOSMResponse {
  return {
    nodeId: 12345,
    changesetId: 67890,
    version: 1,
    lat: -37.8136,
    lon: 144.9631,
    tags: { name: 'Test Business' },
    ...overrides,
  };
}

/**
 * Create a mock Overpass API response
 */
export function createMockOverpassResponse(overrides: Partial<MockOverpassResponse> = {}): MockOverpassResponse {
  return {
    elements: [
      {
        type: 'node',
        id: 12345,
        lat: -37.8136,
        lon: 144.9631,
        tags: {
          name: 'Test Business',
          'currency:XBT': 'yes',
        },
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock OSM node XML
 */
export function createMockNodeXML(nodeId: number, version: number, lat: number, lon: number, tags: Record<string, string> = {}): string {
  const tagXml = Object.entries(tags)
    .map(([k, v]) => `    <tag k="${k}" v="${v}"/>`)
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="test">
  <node id="${nodeId}" version="${version}" lat="${lat}" lon="${lon}" changeset="12345">
${tagXml}
  </node>
</osm>`;
}

/**
 * Create mock OSM way XML
 */
export function createMockWayXML(wayId: number, version: number, nodeIds: number[], tags: Record<string, string> = {}): string {
  const nodeRefs = nodeIds.map(id => `    <nd ref="${id}"/>`).join('\n');
  const tagXml = Object.entries(tags)
    .map(([k, v]) => `    <tag k="${k}" v="${v}"/>`)
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="test">
  <way id="${wayId}" version="${version}" changeset="12345">
${nodeRefs}
${tagXml}
  </way>
</osm>`;
}

/**
 * Create mock changeset XML
 */
export function createMockChangesetXML(changesetId: number, timestamp: string = new Date().toISOString()): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="test">
  <changeset id="${changesetId}" created_at="${timestamp}" closed_at="${timestamp}">
    <tag k="created_by" v="test"/>
    <tag k="comment" v="test changeset"/>
  </changeset>
</osm>`;
}

/**
 * Create a mock Response object
 */
export function createMockResponse(options: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  body?: string | object;
  headers?: HeadersInit;
}): Response {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    body = '',
    headers = new Headers(),
  } = options;

  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  let bodyObject: any;
  try {
    bodyObject = typeof body === 'object' ? body : JSON.parse(bodyText);
  } catch {
    // If it's not valid JSON, just use the string
    bodyObject = bodyText;
  }

  return {
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    text: async () => bodyText,
    json: async () => bodyObject,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    clone: () => createMockResponse(options),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
  } as Response;
}

/**
 * Mock fetch for OSM API calls
 */
export function mockOSMFetch(mockResponses: Map<string, { status: number; body: string }>) {
  global.fetch = vi.fn((url: string | URL, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    const mockResponse = mockResponses.get(urlString);
    
    if (mockResponse) {
      return Promise.resolve(createMockResponse({
        ok: mockResponse.status >= 200 && mockResponse.status < 300,
        status: mockResponse.status,
        body: mockResponse.body,
      }));
    }
    
    // Default 404 for unmocked URLs
    return Promise.resolve(createMockResponse({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      body: 'Not Found',
    }));
  });
}

/**
 * Mock Prisma client
 */
export function createMockPrisma() {
  return {
    submission: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    osmNode: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };
}

/**
 * Mock NextAuth session
 */
export function createMockSession(overrides: any = {}) {
  return {
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      name: 'Test Admin',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

/**
 * Wait for a specific number of fetch calls
 */
export async function waitForFetchCalls(count: number, timeout: number = 5000): Promise<void> {
  const startTime = Date.now();
  while ((global.fetch as any).mock.calls.length < count && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

