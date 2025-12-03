import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as submitPOST } from '../../app/api/submit/route';
import { POST as approvePOST } from '../../app/api/admin/submissions/[id]/approve/route';
import { POST as rejectPOST } from '../../app/api/admin/submissions/[id]/reject/route';
import { NextRequest } from 'next/server';
import { createMockNodeXML, createMockWayXML, createMockResponse } from '../helpers/mocks';

// Mock all dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    submission: {
      create: vi.fn(),
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
    altchaSecretKey: 'test-secret',
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

describe('Submission Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should complete full flow: Submit → Admin Reviews → Approves → OSM Upload → DB Updated', async () => {
      // Step 1: User submits
      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { valid: true },
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { isDuplicate: false },
        }));

        const prismaModFlow1 = await import('@/lib/prisma');
        (prismaModFlow1.prisma.submission.create as any).mockResolvedValueOnce({
        id: 'submission-123',
        status: 'pending',
      });

      const submitRequest = new NextRequest('http://localhost/api/submit', {
        method: 'POST',
        body: JSON.stringify({
          captchaToken: 'valid-token',
          businessName: 'Test Business',
          latitude: -37.8136,
          longitude: 144.9631,
        }),
      });

      const submitResponse = await submitPOST(submitRequest);
      const submitData = await submitResponse.json();

      expect(submitResponse.status).toBe(200);
      expect(submitData.success).toBe(true);
      // Reuse prismaModFlow1 from earlier in the test
      expect(prismaModFlow1.prisma.submission.create).toHaveBeenCalled();

      // Step 2: Admin approves
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      (prismaModFlow1.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: 'submission-123',
        status: 'pending',
        businessName: 'Test Business',
        latitude: -37.8136,
        longitude: 144.9631,
      });

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { access_token: 'test-token' },
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '67890', // changeset
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: '12345', // node
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
        }));

        // Reuse prismaModFlow1 from earlier in the test
        (prismaModFlow1.prisma.submission.update as any).mockResolvedValueOnce({});
        (prismaModFlow1.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const approveRequest = new NextRequest('http://localhost/api/admin/submissions/submission-123/approve', {
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

      const approveResponse = await approvePOST(approveRequest, {
        params: Promise.resolve({ id: 'submission-123' }),
      });

      expect(approveResponse.status).toBe(200);
      // Reuse prismaModFlow1 from earlier in the test
      expect(prismaModFlow1.prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'uploaded',
          }),
        })
      );
      expect(prismaModFlow1.prisma.osmNode.create).toHaveBeenCalled();
    });
  });

  describe('Rejection Path', () => {
    it('should complete flow: Submit → Admin Reviews → Rejects → Status Updated → Email Sent', async () => {
      // Step 1: User submits
      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { valid: true },
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: { isDuplicate: false },
        }));

        const prismaModFlow2 = await import('@/lib/prisma');
        (prismaModFlow2.prisma.submission.create as any).mockResolvedValueOnce({
        id: 'submission-456',
        status: 'pending',
        userEmail: 'user@example.com',
      });

      const submitRequest = new NextRequest('http://localhost/api/submit', {
        method: 'POST',
        body: JSON.stringify({
          captchaToken: 'valid-token',
          businessName: 'Test Business',
          email: 'user@example.com',
          latitude: -37.8136,
          longitude: 144.9631,
        }),
      });

      await submitPOST(submitRequest);

      // Step 2: Admin rejects
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      // Reuse prismaModFlow2 from earlier in the test
      (prismaModFlow2.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: 'submission-456',
        status: 'pending',
        userEmail: 'user@example.com',
      });
        // Reuse prismaModFlow2 from earlier in the test
        (prismaModFlow2.prisma.submission.update as any).mockResolvedValueOnce({});

      const rejectRequest = new NextRequest('http://localhost/api/admin/submissions/submission-456/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Business does not accept Bitcoin' }),
      });

      const rejectResponse = await rejectPOST(rejectRequest, {
        params: Promise.resolve({ id: 'submission-456' }),
      });

      expect(rejectResponse.status).toBe(200);
      // Reuse prismaModFlow2 from earlier in the test
      expect(prismaModFlow2.prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'rejected',
          }),
        })
      );
    });
  });

  describe('Duplicate Update Path', () => {
    it('should complete flow: Submit (duplicate found) → Admin Reviews → Chooses Update → OSM Updated → DB Updated', async () => {
      // Step 1: User submits with duplicate
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true }),
        })
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: {
            isDuplicate: true,
            osmId: 12345,
            osmType: 'node',
          },
        }));

        const prismaModFlow3 = await import('@/lib/prisma');
        (prismaModFlow3.prisma.submission.create as any).mockResolvedValueOnce({
        id: 'submission-789',
        status: 'pending',
        duplicateOsmId: BigInt(12345),
        duplicateOsmType: 'node',
      });

      const submitRequest = new NextRequest('http://localhost/api/submit', {
        method: 'POST',
        body: JSON.stringify({
          captchaToken: 'valid-token',
          businessName: 'Test Business',
          latitude: -37.8136,
          longitude: 144.9631,
        }),
      });

      await submitPOST(submitRequest);

      // Step 2: Admin chooses to update existing
      const nodeXML = createMockNodeXML(12345, 1, -37.8136, 144.9631, {
        name: 'Existing Business',
        'currency:XBT': 'yes',
      });

      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      // Reuse prismaModFlow3 from earlier in the test
      (prismaModFlow3.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: 'submission-789',
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

        // Reuse prismaModFlow3 from earlier in the test
        (prismaModFlow3.prisma.submission.update as any).mockResolvedValueOnce({});
        (prismaModFlow3.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const approveRequest = new NextRequest('http://localhost/api/admin/submissions/submission-789/approve', {
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

      const approveResponse = await approvePOST(approveRequest, {
        params: Promise.resolve({ id: 'submission-789' }),
      });

      expect(approveResponse.status).toBe(200);
      // Verify update was called, not create
      const updateCall = (global.fetch as any).mock.calls.find(
        (call: any[]) => call[0]?.includes('/node/12345')
      );
      expect(updateCall).toBeDefined();
    });
  });

  describe('Duplicate Create Path', () => {
    it('should complete flow: Submit (duplicate found) → Admin Reviews → Chooses Create → New Node Created', async () => {
      // Step 1: User submits with duplicate
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true }),
        })
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: {
            isDuplicate: true,
            osmId: 12345,
            osmType: 'node',
          },
        }));

        const prismaMod2 = await import('@/lib/prisma');
        (prismaMod2.prisma.submission.create as any).mockResolvedValueOnce({
        id: 'submission-999',
        status: 'pending',
        duplicateOsmId: BigInt(12345),
        duplicateOsmType: 'node',
      });

      await submitPOST(
        new NextRequest('http://localhost/api/submit', {
          method: 'POST',
          body: JSON.stringify({
            captchaToken: 'valid-token',
            businessName: 'Test Business',
            latitude: -37.8136,
            longitude: 144.9631,
          }),
        })
      );

      // Step 2: Admin chooses to create new
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      // Reuse prismaMod2 from earlier in the test
      (prismaMod2.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: 'submission-999',
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
          body: '99999', // New node ID
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true, // closeChangeset success
        }));

        // Reuse prismaMod2 from earlier in the test
        (prismaMod2.prisma.submission.update as any).mockResolvedValueOnce({});
        (prismaMod2.prisma.osmNode.create as any).mockResolvedValueOnce({});

      const approveRequest = new NextRequest('http://localhost/api/admin/submissions/submission-999/approve', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            businessName: 'New Business',
            latitude: -37.8137,
            longitude: 144.9632,
          },
          strategy: 'create',
        }),
      });

      const approveResponse = await approvePOST(approveRequest, {
        params: Promise.resolve({ id: 'submission-999' }),
      });

      expect(approveResponse.status).toBe(200);
      // Verify create was called, not update
      const createCall = (global.fetch as any).mock.calls.find(
        (call: any[]) => call[0]?.includes('/node/create')
      );
      expect(createCall).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle version conflict: Admin tries to update → OSM element modified → Error → Submission stays pending', async () => {
      const nodeXML = createMockNodeXML(12345, 1, -37.8136, 144.9631, {});

      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
        const prismaModFlow3 = await import('@/lib/prisma');
        (prismaModFlow3.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: 'submission-123',
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
          ok: false,
          status: 409,
          body: 'Version conflict', // updateNode error
        }));

      const approveRequest = new NextRequest('http://localhost/api/admin/submissions/submission-123/approve', {
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

      const approveResponse = await approvePOST(approveRequest, {
        params: Promise.resolve({ id: 'submission-123' }),
      });

      expect(approveResponse.status).toBeGreaterThanOrEqual(400);
      // Submission should remain pending
      // Reuse prismaModFlow3 from earlier in the test
      expect(prismaModFlow3.prisma.submission.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'uploaded',
          }),
        })
      );
    });

    it('should handle network failure: OSM API down → Error → Submission stays pending', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
        const prismaModFlow4 = await import('@/lib/prisma');
        (prismaModFlow4.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: 'submission-123',
        status: 'pending',
      });

      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'));

      const approveRequest = new NextRequest('http://localhost/api/admin/submissions/submission-123/approve', {
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

      const approveResponse = await approvePOST(approveRequest, {
        params: Promise.resolve({ id: 'submission-123' }),
      });

      expect(approveResponse.status).toBeGreaterThanOrEqual(400);
    });
  });
});

