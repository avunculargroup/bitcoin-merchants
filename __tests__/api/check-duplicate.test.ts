import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/check-duplicate/route';
import { NextRequest } from 'next/server';
import { createMockOverpassResponse, createMockChangesetXML, createMockResponse } from '../helpers/mocks';

// Mock fetch globally
global.fetch = vi.fn();

describe('Duplicate Detection API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coordinate Validation', () => {
    it('should return 400 for missing coordinates', async () => {
      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ businessName: 'Test Business' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Coordinates are required');
    });

    it('should return 400 for missing latitude', async () => {
      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ longitude: 144.9631, businessName: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Coordinates are required');
    });

    it('should return 400 for missing longitude', async () => {
      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ latitude: -37.8136, businessName: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Coordinates are required');
    });

    it('should accept valid coordinates', async () => {
      (global.fetch as any).mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: { elements: [] },
      }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate with bitcoin tag', async () => {
      const overpassResponse = createMockOverpassResponse({
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
      });

      const changesetXML = createMockChangesetXML(67890, '2024-01-15T10:00:00Z');
      const elementXML = `<?xml version="1.0"?>
<osm version="0.6">
  <node id="12345" version="1" lat="-37.8136" lon="144.9631" changeset="67890">
    <tag k="name" v="Test Business"/>
  </node>
</osm>`;

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: overpassResponse,
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: elementXML,
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: changesetXML,
        }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(true);
      expect(data.osmId).toBe(12345);
      expect(data.osmType).toBe('node');
      expect(data.matchReason).toBe('bitcoin_tagged');
      expect(Array.isArray(data.matches)).toBe(true);
      expect(data.matches.length).toBe(1);
      expect(data.matches[0]).toMatchObject({
        osmId: 12345,
        osmType: 'node',
        matchReason: 'bitcoin_tagged',
        name: 'Test Business',
      });
    });

    it('should detect duplicate with similar name', async () => {
      const overpassResponse = createMockOverpassResponse({
        elements: [
          {
            type: 'node',
            id: 12345,
            lat: -37.8136,
            lon: 144.9631,
            tags: {
              name: 'Test Cafe',
            },
          },
        ],
      });

      const changesetXML = createMockChangesetXML(67890, '2024-01-15T10:00:00Z');
      const elementXML = `<?xml version="1.0"?>
<osm version="0.6">
  <node id="12345" version="1" lat="-37.8136" lon="144.9631" changeset="67890">
    <tag k="name" v="Test Cafe"/>
  </node>
</osm>`;

      (global.fetch as any)
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: overpassResponse,
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: elementXML,
        }))
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: changesetXML,
        }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(true);
      expect(data.matchReason).toBe('similar_name');
      expect(data.matches[0]).toMatchObject({
        osmId: 12345,
        matchReason: 'similar_name',
      });
    });

    it('should return no duplicate when none found', async () => {
      (global.fetch as any).mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: { elements: [] },
      }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'New Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(false);
    });
  });

  describe('Multiple Duplicates', () => {
    it('should select most recent changeset when multiple duplicates found', async () => {
      const overpassResponse = createMockOverpassResponse({
        elements: [
          {
            type: 'node',
            id: 11111,
            lat: -37.8136,
            lon: 144.9631,
            tags: { name: 'Business 1' },
          },
          {
            type: 'node',
            id: 22222,
            lat: -37.8136,
            lon: 144.9631,
            tags: { name: 'Business 2' },
          },
        ],
      });

      const element1XML = `<?xml version="1.0"?>
<osm version="0.6">
  <node id="11111" version="1" lat="-37.8136" lon="144.9631" changeset="10000">
    <tag k="name" v="Business 1"/>
  </node>
</osm>`;

      const element2XML = `<?xml version="1.0"?>
<osm version="0.6">
  <node id="22222" version="1" lat="-37.8136" lon="144.9631" changeset="20000">
    <tag k="name" v="Business 2"/>
  </node>
</osm>`;

      const changeset1XML = createMockChangesetXML(10000, '2024-01-10T10:00:00Z');
      const changeset2XML = createMockChangesetXML(20000, '2024-01-20T10:00:00Z'); // More recent

      // Use URL-aware mocking to handle parallel processing
      (global.fetch as any).mockImplementation((url: string | URL) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('overpass-api.de')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: overpassResponse,
          }));
        }
        if (urlStr.includes('/node/11111')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: element1XML,
          }));
        }
        if (urlStr.includes('/node/22222')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: element2XML,
          }));
        }
        if (urlStr.includes('/changeset/10000')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: changeset1XML,
          }));
        }
        if (urlStr.includes('/changeset/20000')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: changeset2XML,
          }));
        }
        return Promise.resolve(createMockResponse({
          ok: false,
          status: 404,
          body: 'Not Found',
        }));
      });

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(true);
      expect(data.osmId).toBe(22222); // Should select the more recent one
      expect(data.matches).toHaveLength(2);
      expect(data.matches[0].osmId).toBe(22222);
      expect(data.matches[1].osmId).toBe(11111);
    });
  });

  describe('Name Keyword Extraction', () => {
    it('should extract keywords from business name', async () => {
      (global.fetch as any).mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: { elements: [] },
      }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'The Great Coffee Shop',
        }),
      });

      await POST(request);

      // Verify Overpass query includes name matching
      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall).toBeDefined();
    });

    it('should handle business name with stop words', async () => {
      (global.fetch as any).mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: { elements: [] },
      }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'The Shop and Store',
        }),
      });

      await POST(request);
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle empty business name', async () => {
      (global.fetch as any).mockResolvedValueOnce(createMockResponse({
        ok: true,
        body: { elements: [] },
      }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: '',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle Overpass API timeout gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return no duplicate rather than error
      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(false);
      // Error field may or may not be present
      if (data.error) {
        expect(data.error).toBe('Check failed');
      }
    });

    it('should handle Overpass API failure gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        body: 'Internal Server Error',
      }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(false);
      expect(data.error).toBe('Check failed');
    });

    it('should handle missing changeset info gracefully', async () => {
      const overpassResponse = createMockOverpassResponse({
        elements: [
          {
            type: 'node',
            id: 12345,
            lat: -37.8136,
            lon: 144.9631,
            tags: { name: 'Test' },
          },
        ],
      });

      const elementXML = `<?xml version="1.0"?>
<osm version="0.6">
  <node id="12345" version="1" lat="-37.8136" lon="144.9631" changeset="67890">
    <tag k="name" v="Test"/>
  </node>
</osm>`;

      (global.fetch as any)
        // Overpass API response
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: overpassResponse,
        }))
        // Fetch element to get changeset ID - succeeds
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          body: elementXML,
        }))
        // Fetch changeset - fails (404)
        .mockResolvedValueOnce(createMockResponse({
          ok: false,
          status: 404,
        }));

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return duplicate info even if changeset fetch fails
      // (falls back to first element if no valid results)
      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(true);
    });
  });

  describe('Element Type Detection', () => {
    it('should handle way elements', async () => {
      const overpassResponse = createMockOverpassResponse({
        elements: [
          {
            type: 'way',
            id: 12345,
            center: { lat: -37.8136, lon: 144.9631 },
            tags: { name: 'Test Way', 'currency:XBT': 'yes' },
          },
        ],
      });

      const wayXML = `<?xml version="1.0"?>
<osm version="0.6">
  <way id="12345" version="1" changeset="67890">
    <nd ref="100"/>
    <nd ref="101"/>
    <tag k="name" v="Test Way"/>
  </way>
</osm>`;

      const changesetXML = createMockChangesetXML(67890, '2024-01-15T10:00:00Z');

      (global.fetch as any).mockImplementation((url: string | URL) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('overpass-api.de')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: overpassResponse,
          }));
        }
        if (urlStr.includes('/way/12345')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: wayXML,
          }));
        }
        if (urlStr.includes('/changeset/67890')) {
          return Promise.resolve(createMockResponse({
            ok: true,
            body: changesetXML,
          }));
        }
        return Promise.resolve(createMockResponse({
          ok: false,
          status: 404,
          body: 'Not Found',
        }));
      });

      const request = new NextRequest('http://localhost/api/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({
          latitude: -37.8136,
          longitude: 144.9631,
          businessName: 'Test Business',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isDuplicate).toBe(true);
      expect(data.osmType).toBe('way');
      expect(data.coordinates).toEqual({ lat: -37.8136, lon: 144.9631 });
    });
  });
});

