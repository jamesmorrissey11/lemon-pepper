import 'next/dist/compiled/server-only';

import type { RawSearchResult } from '@/types/search';

import { getServerEnvironment, ServerEnvironmentError } from './env';

const SERPER_SEARCH_URL = 'https://google.serper.dev/search';

/**
 * Maximum time allowed for a Serper request before it is aborted.
 */
export const SERPER_REQUEST_TIMEOUT_MS = 5_000;

/**
 * Stable failure categories exposed to internal callers of the Serper client.
 */
export type SerperClientErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'MALFORMED_RESPONSE';

/**
 * Represents a safe, typed failure from the internal Serper integration.
 */
export class SerperClientError extends Error {
  constructor(
    readonly code: SerperClientErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SerperClientError';
  }
}

function readApiKey(): string {
  try {
    return getServerEnvironment().serperApiKey;
  } catch (error) {
    if (error instanceof ServerEnvironmentError) {
      throw new SerperClientError('CONFIGURATION_ERROR', error.message);
    }

    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapOrganicResult(value: unknown): RawSearchResult | null {
  if (!isRecord(value)) {
    return null;
  }

  const { link, position, snippet, title } = value;

  if (
    typeof title !== 'string' ||
    title.length === 0 ||
    typeof link !== 'string' ||
    link.length === 0 ||
    typeof position !== 'number' ||
    !Number.isInteger(position) ||
    position < 1 ||
    (snippet !== undefined && typeof snippet !== 'string')
  ) {
    return null;
  }

  const result: RawSearchResult = {
    title,
    link,
    position,
  };

  if (typeof snippet === 'string') {
    result.snippet = snippet;
  }

  return result;
}

function mapProviderPayload(payload: unknown): RawSearchResult[] {
  if (!isRecord(payload) || !Array.isArray(payload.organic)) {
    throw new SerperClientError(
      'MALFORMED_RESPONSE',
      'Search provider returned an invalid response.',
    );
  }

  const results = payload.organic.map(mapOrganicResult);

  if (results.some((result) => result === null)) {
    throw new SerperClientError(
      'MALFORMED_RESPONSE',
      'Search provider returned an invalid response.',
    );
  }

  return results as RawSearchResult[];
}

/**
 * Searches Serper and returns the provider's organic results in the shared raw-result shape.
 *
 * @param query - Search query to send to Serper.
 * @returns Strictly validated organic search results.
 * @throws SerperClientError When configuration, transport, or provider data is invalid.
 */
export async function searchWithSerper(query: string): Promise<RawSearchResult[]> {
  const apiKey = readApiKey();
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), SERPER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SERPER_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ q: query }),
      signal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      throw new SerperClientError('TIMEOUT', 'Search provider request timed out.');
    }

    if (!response.ok) {
      throw new SerperClientError(
        'PROVIDER_ERROR',
        'Search provider returned an unsuccessful response.',
      );
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      if (abortController.signal.aborted) {
        throw new SerperClientError('TIMEOUT', 'Search provider request timed out.');
      }

      throw new SerperClientError(
        'MALFORMED_RESPONSE',
        'Search provider returned an invalid response.',
      );
    }

    if (abortController.signal.aborted) {
      throw new SerperClientError('TIMEOUT', 'Search provider request timed out.');
    }

    return mapProviderPayload(payload);
  } catch (error) {
    if (error instanceof SerperClientError) {
      throw error;
    }

    if (abortController.signal.aborted) {
      throw new SerperClientError('TIMEOUT', 'Search provider request timed out.');
    }

    throw new SerperClientError('NETWORK_ERROR', 'Search provider request failed.');
  } finally {
    clearTimeout(timeout);
  }
}
