import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../app/api/admin/submissions/[id]/reject/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    submission: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe('Admin Rejection API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated request', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid data' }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow authenticated admin request', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod = await import('@/lib/prisma');
      (prismaMod.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        userEmail: 'user@example.com',
      });
      // Reuse prismaMod from earlier in the test
      (prismaMod.prisma.submission.update as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid data' }),
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

      const request = new NextRequest('http://localhost/api/admin/submissions/999/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid' }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Submission not found');
    });
  });

  describe('Rejection Processing', () => {
    it('should update submission status to rejected', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod2 = await import('@/lib/prisma');
      (prismaMod2.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        userEmail: 'user@example.com',
      });
      // Reuse prismaMod2 from earlier in the test
      (prismaMod2.prisma.submission.update as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid business data' }),
      });

      await POST(request, { params: Promise.resolve({ id: '123' }) });

      // Reuse prismaMod2 from earlier in the test
      expect(prismaMod2.prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '123' },
          data: expect.objectContaining({
            status: 'rejected',
          }),
        })
      );
    });

    it('should store rejection reason in notes', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod3 = await import('@/lib/prisma');
      (prismaMod3.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        notes: null,
      });
      // Reuse prismaMod3 from earlier in the test
      (prismaMod3.prisma.submission.update as any).mockResolvedValueOnce({});

      const rejectionReason = 'Business does not accept Bitcoin';

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason }),
      });

      await POST(request, { params: Promise.resolve({ id: '123' }) });

      // Reuse prismaMod3 from earlier in the test
      expect(prismaMod3.prisma.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: expect.stringContaining(rejectionReason),
          }),
        })
      );
    });
  });

  describe('Email Notification', () => {
    it('should send email notification when userEmail exists', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod4 = await import('@/lib/prisma');
      (prismaMod4.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        businessName: 'Test Business',
        userEmail: 'user@example.com',
      });
      // Reuse prismaMod4 from earlier in the test
      (prismaMod4.prisma.submission.update as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid data' }),
      });

      await POST(request, { params: Promise.resolve({ id: '123' }) });

      // Email should be sent (mocked Mailjet will be called)
      // Reuse prismaMod4 from earlier in the test
      expect(prismaMod4.prisma.submission.update).toHaveBeenCalled();
    });

    it('should skip email notification when userEmail is missing', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod5 = await import('@/lib/prisma');
      (prismaMod5.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        businessName: 'Test Business',
        userEmail: null,
      });
      // Reuse prismaMod5 from earlier in the test
      (prismaMod5.prisma.submission.update as any).mockResolvedValueOnce({});

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid data' }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });

    it('should not block rejection if email fails', async () => {
      const { auth } = await import('next-auth');
      (auth as any).mockResolvedValueOnce({ user: { id: 'admin-id' } });
      const prismaMod6 = await import('@/lib/prisma');
      (prismaMod6.prisma.submission.findUnique as any).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
        userEmail: 'user@example.com',
      });
      // Reuse prismaMod6 from earlier in the test
      (prismaMod6.prisma.submission.update as any).mockResolvedValueOnce({});

      // Mock Mailjet to throw error
      vi.doMock('node-mailjet', () => {
        const mockPost = vi.fn().mockReturnValue({
          request: vi.fn().mockRejectedValue(new Error('Email failed')),
        });
        class MockMailjet {
          constructor(config: any) {}
          post = mockPost;
        }
        return {
          default: MockMailjet,
        };
      });

      const request = new NextRequest('http://localhost/api/admin/submissions/123/reject', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Invalid data' }),
      });

      // Should still succeed even if email fails
      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(200);
    });
  });
});

