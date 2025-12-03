import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../app/api/admin/submissions/[id]/approve/route';
import { NextRequest } from 'next/server';
import { createMockNodeXML, createMockWayXML, createMockResponse } from '../../helpers/mocks';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    submission: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    osmNode: {
      create: vi.fn(),
    },
  },
}));

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  auth: mockAuth,
}));

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/env', () => ({
  env: {
    osmClientId: 'test-client-id',
    osmClientSecret: 'test-client-secret',
    osmRefreshToken: 'test-refresh-token',
    mailjetApiKey: 'test-key',
    mailjetApiSecret: 'test-secret',
    mailjetFromEmail: 'test@example.com',
  },
}));

vi.mock('node-mailjet', () => {
  const mockPost = vi.fn().mockReturnValue({
    request: vi.fn().mockResolvedValue({}),
  });
  
  class MockMailjet {
    constructor(config: any) {}
    post = mockPost;
  }
  
  return {
    default: MockMailjet,
  };
});

vi.mock('@/lib/osm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/osm')>();
  return {
    ...actual,
    getAccessToken: vi.fn(() => Promise.resolve('mock-access-token')),
  };
});

global.fetch = vi.fn();

describe('Admin Approval API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure fetch is a mock function
    if (!(global.fetch as any).mockResolvedValueOnce) {
      (global.fetch as any) = vi.fn();
    }
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated request', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {},
          strategy: 'create',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow authenticated admin request', async () => {
      const { auth } = await import('next-auth');
      const { prisma } = await import('@/lib/prisma');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      (prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        businessName: 'Test Business',
      });

      // Reset and set up fetch mocks fresh for this test
      (global.fetch as any).mockReset();
      
      // Mock fetch calls in order:
      // Note: getAccessToken is not exported, so the mock doesn't work - it makes real fetch calls
      // getAccessToken caches the token, so it only makes one OAuth fetch call (the first time)
      // 1. OAuth token fetch (first call to getAccessToken, caches the token)
      // 2. openChangeset - returns changeset ID (uses cached token, no OAuth fetch)
      // 3. createNode - returns node ID (uses cached token, no OAuth fetch)
      // 4. closeChangeset - returns empty body (uses cached token, no OAuth fetch)
      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { access_token: 'mock-token' }, // OAuth token (cached after first call)
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID from openChangeset
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '12345', // node ID from createNode
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          status: 200,
          body: '', // closeChangeset success
        }));

      // Reuse prisma from earlier in the test
      (prisma.submission.update as any).mockResolvedValueOnce({});
      (prisma.osmNode.create as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Test Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'create',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });
  });

  describe('Submission Validation', () => {
    it('should return 404 for submission not found', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const { prisma } = await import('@/lib/prisma');
      (prisma.submission.findUnique as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/admin/submissions/999/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {},
          strategy: 'create',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Submission not found');
    });
  });

  describe('Strategy: Create New Node', () => {
    it('should create node successfully with valid coordinates', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod = await import('@/lib/prisma');
      (prismaMod.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        businessName: 'Test Business',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID from openChangeset
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '12345', // node ID from createNode (must be parseable as integer)
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '', // closeChangeset success (empty body)
        }));

      // Reuse prismaMod from earlier in the test
      (prismaMod.prisma.submission.update as any).mockResolvedValueOnce({});
      (prismaMod.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Test Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'create',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });

    it('should handle OSM API failure gracefully', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod6 = await import('@/lib/prisma');
      (prismaMod6.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { access_token: 'test-token' },
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: false,
          status: 500,
          body: 'Internal Server Error',
        }));

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'create',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Strategy: Update Existing', () => {
    it('should update node successfully', async () => {
      const nodeXML = createMockNodeXML(12345, 1, -37.8136, 144.9631, {
        name: 'Existing Business',
        'currency:XBT': 'yes',
      });

      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod2 = await import('@/lib/prisma');
      (prismaMod2.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        duplicateOsmId: BigInt(12345),
        duplicateOsmType: 'node',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: nodeXML, // node XML
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true, // updateNode success
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true, // closeChangeset success
        }));

      // Reuse prismaMod2 from earlier in the test
      (prismaMod2.prisma.submission.update as any).mockResolvedValueOnce({});
      (prismaMod2.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Updated Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'update',
          duplicateOsmId: '12345',
          duplicateOsmType: 'node',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });

    it('should handle version conflict (409)', async () => {
      const nodeXML = createMockNodeXML(12345, 1, -37.8136, 144.9631, {});

      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod7 = await import('@/lib/prisma');
      (prismaMod7.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        duplicateOsmId: BigInt(12345),
        duplicateOsmType: 'node',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { access_token: 'test-token' },
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: nodeXML,
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890',
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: false,
          status: 409,
          body: 'Version conflict',
        }));

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Updated Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'update',
          duplicateOsmId: '12345',
          duplicateOsmType: 'node',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle deleted element (410)', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod8 = await import('@/lib/prisma');
      (prismaMod8.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        duplicateOsmId: BigInt(12345),
        duplicateOsmType: 'node',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: false,
          status: 410,
          body: 'Gone',
        }));

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Updated Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'update',
          duplicateOsmId: '12345',
          duplicateOsmType: 'node',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should preserve way node references when updating way', async () => {
      const wayXML = createMockWayXML(12345, 1, [100, 101, 102], {
        name: 'Existing Way',
      });

      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod3 = await import('@/lib/prisma');
      (prismaMod3.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        duplicateOsmId: BigInt(12345),
        duplicateOsmType: 'way',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID from openChangeset
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: wayXML, // way XML from fetchWay
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true, // updateWay success
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '', // closeChangeset success (empty body)
        }));

      // Reuse prismaMod3 from earlier in the test
      (prismaMod3.prisma.submission.update as any).mockResolvedValueOnce({});
      (prismaMod3.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Updated Way',
          },
          strategy: 'update',
          duplicateOsmId: '12345',
          duplicateOsmType: 'way',
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      
      expect(response.status).toBe(200);
      
      // Verify way update was called with node references
      // Find the PUT request to /way/12345 (updateWay), not the GET request (fetchWay)
      const updateCall = (global.fetch as any).mock.calls.find(
        (call: any[]) => {
          const url = typeof call[0] === 'string' ? call[0] : call[0]?.toString();
          const options = call[1];
          return url?.includes('/way/12345') && options?.method === 'PUT';
        }
      );
      expect(updateCall).toBeDefined();
      expect(updateCall.length).toBeGreaterThanOrEqual(2);
      // The second argument to fetch is the options object
      const options = updateCall[1];
      expect(options).toBeDefined();
      expect(options).toHaveProperty('body');
      const body = options.body;
      // Body might be a string or a ReadableStream, convert to string if needed
      const bodyText = typeof body === 'string' ? body : body?.toString() || '';
      expect(bodyText).toBeTruthy();
      expect(bodyText).toContain('<nd ref="100"/>');
      expect(bodyText).toContain('<nd ref="101"/>');
      expect(bodyText).toContain('<nd ref="102"/>');
    });
  });

  describe('Data Integrity', () => {
    it('should update submission status to uploaded on success', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod4 = await import('@/lib/prisma');
      (prismaMod4.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '12345', // node ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true, // closeChangeset success
        }));

      // Reuse prismaMod4 from earlier in the test
      (prismaMod4.prisma.submission.update as any).mockResolvedValueOnce({});
      (prismaMod4.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Test Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'create',
        }),
      });

      await POST(request, { params: Promise.resolve({ id: '123' }) });

      // Reuse prismaMod4 from earlier in the test
      expect(prismaMod4.prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '123' },
          data: expect.objectContaining({
            status: 'uploaded',
          }),
        })
      );
    });

    it('should create OSM node record on success', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod5 = await import('@/lib/prisma');
      (prismaMod5.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '12345', // node ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true, // closeChangeset success
        }));

      // Reuse prismaMod5 from earlier in the test
      (prismaMod5.prisma.submission.update as any).mockResolvedValueOnce({});
      (prismaMod5.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'Test Business',
            latitude: -37.8136,
            longitude: 144.9631,
          },
          strategy: 'create',
        }),
      });

      await POST(request, { params: Promise.resolve({ id: '123' }) });

      // Reuse prismaMod5 from earlier in the test
      expect(prismaMod5.prisma.osmNode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            osmId: BigInt(12345),
            submissionId: '123',
            changesetId: BigInt(67890),
          }),
        })
      );
    });
  });
});

