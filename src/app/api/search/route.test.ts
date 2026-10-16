import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BASE_SEARCH_QUERY, MAX_REFINEMENT_LENGTH } from '@/lib/search-config';
import {
  SerperClientError,
  searchWithSerper,
} from '@/lib/server/serper-client';

import { POST } from './route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/serper-client', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/server/serper-client')>();

  return {
    ...actual,
    searchWithSerper: vi.fn(),
  };
});

const searchWithSerperMock = vi.mocked(searchWithSerper);
const invalidRequest = {
  error: {
    code: 'INVALID_REQUEST',
    message: 'The search request is invalid.',
  },
};

function searchRequest(body: unknown): Request {
  return new Request('http://localhost/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/search', () => {
  beforeEach(() => {
    searchWithSerperMock.mockReset();
  });

  it.each([
    ['missing', {}],
    ['whitespace-only', { refinement: '   ' }],
  ])('runs the default query for a %s refinement', async (_description, body) => {
    searchWithSerperMock.mockResolvedValue([]);

    const response = await POST(searchRequest(body));

    expect(searchWithSerperMock).toHaveBeenCalledOnce();
    expect(searchWithSerperMock).toHaveBeenCalledWith(BASE_SEARCH_QUERY);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      query: BASE_SEARCH_QUERY,
      results: [],
    });
  });

  it('trims a refinement, searches, and ranks provider results', async () => {
    searchWithSerperMock.mockResolvedValue([
      {
        title: 'Lemon Pepper Drop Martini in Atlanta',
        link: 'https://venue.example.com/menu',
        snippet: 'Cocktail menu at an Atlanta restaurant.',
        position: 1,
      },
    ]);

    const response = await POST(
      searchRequest({ refinement: '  Midtown patio  ' }),
    );

    expect(searchWithSerperMock).toHaveBeenCalledWith(
      `${BASE_SEARCH_QUERY} Midtown patio`,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      query: `${BASE_SEARCH_QUERY} Midtown patio`,
      results: [
        expect.objectContaining({
          title: 'Lemon Pepper Drop Martini in Atlanta',
          url: 'https://venue.example.com/menu',
          sourceHost: 'venue.example.com',
          snippet: 'Cocktail menu at an Atlanta restaurant.',
          score: expect.any(Number),
          matchReasons: expect.any(Array),
        }),
      ],
    });
  });

  it('returns an empty successful response for no provider results', async () => {
    searchWithSerperMock.mockResolvedValue([]);

    const response = await POST(searchRequest({}));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      query: BASE_SEARCH_QUERY,
      results: [],
    });
  });

  it('returns 400 for malformed JSON', async () => {
    const request = new Request('http://localhost/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"refinement":',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(invalidRequest);
    expect(searchWithSerperMock).not.toHaveBeenCalled();
  });

  it.each([
    ['null body', null],
    ['array body', []],
    ['string body', 'Midtown'],
    ['null refinement', { refinement: null }],
    ['numeric refinement', { refinement: 42 }],
    ['object refinement', { refinement: {} }],
    ['an unknown property', { refinement: 'Midtown', extra: true }],
  ])('returns 400 for %s', async (_description, body) => {
    const response = await POST(searchRequest(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(invalidRequest);
    expect(searchWithSerperMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the trimmed refinement is too long', async () => {
    const response = await POST(
      searchRequest({
        refinement: ` ${'x'.repeat(MAX_REFINEMENT_LENGTH + 1)} `,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(invalidRequest);
    expect(searchWithSerperMock).not.toHaveBeenCalled();
  });

  it.each([
    'TIMEOUT',
    'NETWORK_ERROR',
    'PROVIDER_ERROR',
    'MALFORMED_RESPONSE',
  ] as const)('maps %s provider failures to a safe 502 response', async (code) => {
    searchWithSerperMock.mockRejectedValue(
      new SerperClientError(code, 'internal provider details and secret-key'),
    );

    const response = await POST(searchRequest({}));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: {
        code: 'SEARCH_UNAVAILABLE',
        message: 'Search is temporarily unavailable.',
      },
    });
    expect(JSON.stringify(body)).not.toMatch(/provider details|secret-key/i);
  });

  it('maps missing configuration to a safe 503 response', async () => {
    searchWithSerperMock.mockRejectedValue(
      new SerperClientError(
        'CONFIGURATION_ERROR',
        'SERPER_API_KEY has secret details',
      ),
    );

    const response = await POST(searchRequest({}));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'Search is not configured.',
      },
    });
    expect(JSON.stringify(body)).not.toMatch(/SERPER_API_KEY|secret details/i);
  });
});
