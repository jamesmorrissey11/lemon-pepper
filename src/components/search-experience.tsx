'use client';

import { useRef, useState } from 'react';

import type {
  RankedSearchResult,
  SearchErrorCode,
  SearchErrorResponse,
  SearchRequest,
  SearchResponse,
} from '@/types/search';

import { SearchForm } from './search-form';
import { SearchResults } from './search-results';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; response: SearchResponse }
  | { status: 'error'; message: string };

const ERROR_CODES: SearchErrorCode[] = [
  'CONFIGURATION_ERROR',
  'INVALID_REQUEST',
  'SEARCH_UNAVAILABLE',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRankedSearchResult(value: unknown): value is RankedSearchResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === 'string' &&
    typeof value.url === 'string' &&
    typeof value.sourceHost === 'string' &&
    typeof value.snippet === 'string' &&
    typeof value.score === 'number' &&
    Number.isFinite(value.score) &&
    Array.isArray(value.matchReasons) &&
    value.matchReasons.every((reason) => typeof reason === 'string')
  );
}

function isSearchResponse(value: unknown): value is SearchResponse {
  return (
    isRecord(value) &&
    typeof value.query === 'string' &&
    Array.isArray(value.results) &&
    value.results.every(isRankedSearchResult)
  );
}

function isSearchErrorResponse(value: unknown): value is SearchErrorResponse {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === 'string' &&
    ERROR_CODES.includes(value.error.code as SearchErrorCode) &&
    typeof value.error.message === 'string'
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function getApiErrorMessage(status: number, body: unknown) {
  if (
    status === 400 ||
    (isSearchErrorResponse(body) && body.error.code === 'INVALID_REQUEST')
  ) {
    return 'That refinement could not be searched. Check it and try again.';
  }

  if (isSearchErrorResponse(body) && body.error.code === 'CONFIGURATION_ERROR') {
    return 'Search is temporarily unavailable because it is not configured. Please try again later.';
  }

  return 'The search provider is unavailable right now. Please try again.';
}

/**
 * Coordinates local API requests and the user-visible search states.
 */
export function SearchExperience() {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const requestInFlight = useRef(false);

  async function runSearch(refinement?: string) {
    if (requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;
    setState({ status: 'loading' });

    const request: SearchRequest = refinement ? { refinement } : {};

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const body = await readJson(response);

      if (!response.ok) {
        setState({ status: 'error', message: getApiErrorMessage(response.status, body) });
        return;
      }

      if (!isSearchResponse(body)) {
        setState({
          status: 'error',
          message: 'The search service returned an unexpected response. Please try again.',
        });
        return;
      }

      setState({ status: 'success', response: body });
    } catch {
      setState({
        status: 'error',
        message: 'Could not reach the search service. Check your connection and try again.',
      });
    } finally {
      requestInFlight.current = false;
    }
  }

  const resultCount =
    state.status === 'success' ? state.response.results.length : undefined;

  return (
    <section className="search-experience" aria-labelledby="search-heading">
      <div className="search-panel">
        <div>
          <p className="section-label">Search Atlanta</p>
          <h2 id="search-heading">Start with the city or narrow the search</h2>
          <p className="search-guidance">
            Run the default search, or add one neighborhood or preference.
          </p>
        </div>
        <SearchForm isSubmitting={state.status === 'loading'} onSubmit={runSearch} />
      </div>

      <div className="search-state" aria-atomic="true">
        {state.status === 'idle' ? (
          <p className="idle-message">
            Ready when you are. No search runs until you submit the form.
          </p>
        ) : null}
        {state.status === 'loading' ? (
          <p className="loading-message" role="status">
            Searching Atlanta sources…
          </p>
        ) : null}
        {state.status === 'error' ? (
          <div className="error-message" role="alert">
            <h2>Search unavailable</h2>
            <p>{state.message}</p>
          </div>
        ) : null}
        {state.status === 'success' ? (
          <>
            <p className="visually-hidden" role="status">
              Search complete. {resultCount === 0 ? 'No' : resultCount} ranked{' '}
              {resultCount === 1 ? 'result' : 'results'} found for {state.response.query}.
            </p>
            <div className="results-region">
              <p className="query-summary">
                Web results for <strong>{state.response.query}</strong>
              </p>
              <SearchResults results={state.response.results} />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
