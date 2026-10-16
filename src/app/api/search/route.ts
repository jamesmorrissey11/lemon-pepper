import {
  InvalidSearchRefinementError,
  buildSearchQuery,
} from '@/lib/search/build-query';
import { rankSearchResults } from '@/lib/search/rank-results';
import {
  SerperClientError,
  searchWithSerper,
} from '@/lib/server/serper-client';
import type {
  SearchErrorCode,
  SearchErrorResponse,
  SearchRequest,
  SearchResponse,
} from '@/types/search';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSearchRequest(value: unknown): value is SearchRequest {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== 'refinement')) {
    return false;
  }

  return value.refinement === undefined || typeof value.refinement === 'string';
}

function errorResponse(
  status: number,
  code: SearchErrorCode,
  message: string,
): Response {
  const body: SearchErrorResponse = {
    error: {
      code,
      message,
    },
  };

  return Response.json(body, { status });
}

function invalidRequestResponse(): Response {
  return errorResponse(
    400,
    'INVALID_REQUEST',
    'The search request is invalid.',
  );
}

/**
 * Validates and executes a server-side search for ranked Atlanta cocktail results.
 */
export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return invalidRequestResponse();
  }

  if (!isSearchRequest(payload)) {
    return invalidRequestResponse();
  }

  let query: string;

  try {
    query = buildSearchQuery(payload.refinement);
  } catch (error) {
    if (error instanceof InvalidSearchRefinementError) {
      return invalidRequestResponse();
    }

    return errorResponse(
      502,
      'SEARCH_UNAVAILABLE',
      'Search is temporarily unavailable.',
    );
  }

  try {
    const rawResults = await searchWithSerper(query);
    const response: SearchResponse = {
      query,
      results: rankSearchResults(rawResults),
    };

    return Response.json(response);
  } catch (error) {
    if (
      error instanceof SerperClientError &&
      error.code === 'CONFIGURATION_ERROR'
    ) {
      return errorResponse(
        503,
        'CONFIGURATION_ERROR',
        'Search is not configured.',
      );
    }

    return errorResponse(
      502,
      'SEARCH_UNAVAILABLE',
      'Search is temporarily unavailable.',
    );
  }
}
