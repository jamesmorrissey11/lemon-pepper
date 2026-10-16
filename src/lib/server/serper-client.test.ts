import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SERPER_REQUEST_TIMEOUT_MS,
  SerperClientError,
  searchWithSerper,
} from './serper-client';

vi.mock('server-only', () => ({}));

const TEST_API_KEY = 'test-serper-api-key';

async function captureSerperError(request: Promise<unknown>): Promise<SerperClientError> {
  try {
    await request;
    throw new Error('Expected the Serper request to fail.');
  } catch (error) {
    if (!(error instanceof SerperClientError)) {
      throw error;
    }

    return error;
  }
}

describe('searchWithSerper', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('posts the query and maps only raw organic result fields', async () => {
    vi.stubEnv('SERPER_API_KEY', TEST_API_KEY);
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        organic: [
          {
            title: 'Atlanta Restaurant',
            link: 'https://example.com/menu',
            snippet: 'A lemon pepper drop martini appears on the menu.',
            position: 1,
            ignoredProviderField: 'not returned',
          },
          {
            title: 'Second Result',
            link: 'https://example.org/',
            position: 2,
          },
        ],
        ignoredTopLevelField: true,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchWithSerper('lemon pepper drop martini Atlanta');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': TEST_API_KEY,
      },
      body: JSON.stringify({ q: 'lemon pepper drop martini Atlanta' }),
      signal: expect.any(AbortSignal),
    });
    expect(results).toEqual([
      {
        title: 'Atlanta Restaurant',
        link: 'https://example.com/menu',
        snippet: 'A lemon pepper drop martini appears on the menu.',
        position: 1,
      },
      {
        title: 'Second Result',
        link: 'https://example.org/',
        position: 2,
      },
    ]);
  });

  it('fails with a typed configuration error when the API key is missing', async () => {
    vi.stubEnv('SERPER_API_KEY', '   ');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const error = await captureSerperError(searchWithSerper('query'));

    expect(error).toMatchObject({
      code: 'CONFIGURATION_ERROR',
      message: 'Serper API key is not configured.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts a request that exceeds the timeout', async () => {
    vi.useFakeTimers();
    vi.stubEnv('SERPER_API_KEY', TEST_API_KEY);
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const errorPromise = captureSerperError(searchWithSerper('query'));
    await vi.advanceTimersByTimeAsync(SERPER_REQUEST_TIMEOUT_MS);
    const error = await errorPromise;

    expect(error).toMatchObject({
      code: 'TIMEOUT',
      message: 'Search provider request timed out.',
    });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('maps network failures without exposing the underlying error', async () => {
    vi.stubEnv('SERPER_API_KEY', TEST_API_KEY);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(`failed with ${TEST_API_KEY}`)));

    const error = await captureSerperError(searchWithSerper('query'));

    expect(error).toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Search provider request failed.',
    });
    expect(error.message).not.toContain(TEST_API_KEY);
  });

  it('maps non-2xx responses without reading or exposing the response body', async () => {
    vi.stubEnv('SERPER_API_KEY', TEST_API_KEY);
    const response = new Response(`provider details containing ${TEST_API_KEY}`, {
      status: 429,
    });
    const jsonSpy = vi.spyOn(response, 'json');
    const textSpy = vi.spyOn(response, 'text');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const error = await captureSerperError(searchWithSerper('query'));

    expect(error).toMatchObject({
      code: 'PROVIDER_ERROR',
      message: 'Search provider returned an unsuccessful response.',
    });
    expect(error.message).not.toContain(TEST_API_KEY);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(textSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['missing organic results', {}],
    ['a non-array organic value', { organic: 'invalid' }],
    [
      'an organic result with an invalid required field',
      {
        organic: [
          {
            title: 'Result',
            link: 'https://example.com/',
            position: '1',
          },
        ],
      },
    ],
    [
      'an organic result with an invalid optional snippet',
      {
        organic: [
          {
            title: 'Result',
            link: 'https://example.com/',
            snippet: null,
            position: 1,
          },
        ],
      },
    ],
  ])('rejects malformed payloads with %s', async (_description, payload) => {
    vi.stubEnv('SERPER_API_KEY', TEST_API_KEY);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)));

    const error = await captureSerperError(searchWithSerper('query'));

    expect(error).toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: 'Search provider returned an invalid response.',
    });
  });

  it('rejects a provider response that is not valid JSON', async () => {
    vi.stubEnv('SERPER_API_KEY', TEST_API_KEY);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`not JSON and must not leak ${TEST_API_KEY}`, {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const error = await captureSerperError(searchWithSerper('query'));

    expect(error).toMatchObject({
      code: 'MALFORMED_RESPONSE',
      message: 'Search provider returned an invalid response.',
    });
    expect(error.message).not.toContain(TEST_API_KEY);
  });
});
