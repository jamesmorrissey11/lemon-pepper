import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchResponse } from '@/types/search';

import { SearchExperience } from './search-experience';

const successfulSearch: SearchResponse = {
  query: 'lemon pepper drop martini Atlanta',
  results: [
    {
      title: 'First Atlanta cocktail source',
      url: 'https://first.example/menu',
      sourceHost: 'first.example',
      snippet: 'A menu result mentioning the cocktail.',
      score: 25,
      matchReasons: ['Exact cocktail phrase', 'Atlanta match'],
    },
    {
      title: 'Second Atlanta cocktail source',
      url: 'https://second.example/guide',
      sourceHost: 'second.example',
      snippet: 'A local guide with a related result.',
      score: 15,
      matchReasons: ['Related terms'],
    },
  ],
};

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('SearchExperience', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('waits for the user and submits the default SearchRequest', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(mockResponse(successfulSearch));
    render(<SearchExperience />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/no search runs until you submit/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });

  it('submits an optional refinement in the shared request shape', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      mockResponse({ ...successfulSearch, query: `${successfulSearch.query} Midtown patio` }),
    );
    render(<SearchExperience />);

    await user.type(
      screen.getByRole('textbox', { name: /neighborhood or preference/i }),
      'Midtown patio',
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      refinement: 'Midtown patio',
    });
  });

  it('locks repeated submissions while a request is loading', async () => {
    const user = userEvent.setup();
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByRole('status')).toHaveTextContent(/searching Atlanta sources/i);
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: /neighborhood or preference/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /searching/i }));
    expect(fetchMock).toHaveBeenCalledOnce();

    resolveFetch(mockResponse(successfulSearch));
    expect(
      await screen.findByRole('heading', { name: 'Ranked results' }),
    ).toBeInTheDocument();
  });

  it('renders a successful response in ranked order with source evidence', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(mockResponse(successfulSearch));
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    const results = await screen.findByRole('list', { name: /ranked search results/i });
    const resultHeadings = within(results).getAllByRole('heading', { level: 3 });
    expect(resultHeadings.map((heading) => heading.textContent)).toEqual([
      'First Atlanta cocktail source',
      'Second Atlanta cocktail source',
    ]);
    expect(within(results).getByText('first.example')).toBeInTheDocument();
    expect(
      within(results).getByText('A menu result mentioning the cocktail.'),
    ).toBeInTheDocument();
    expect(within(results).getByText('Exact cocktail phrase')).toBeInTheDocument();
    expect(
      within(results).getByRole('link', { name: 'First Atlanta cocktail source' }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('announces and renders an empty response', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      mockResponse({ query: successfulSearch.query, results: [] } satisfies SearchResponse),
    );
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(
      await screen.findByRole('heading', { name: /no results found/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/no ranked results found/i);
  });

  it('announces a safe invalid-input error for a 400 response', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      mockResponse(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Refinement is too long.',
          },
        },
        400,
      ),
    );
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /refinement could not be searched/i,
    );
    expect(screen.queryByText('Refinement is too long.')).not.toBeInTheDocument();
  });

  it('announces a provider failure without exposing response details', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      mockResponse(
        {
          error: {
            code: 'SEARCH_UNAVAILABLE',
            message: 'Upstream provider included internal details.',
          },
        },
        502,
      ),
    );
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /search provider is unavailable/i,
    );
    expect(screen.queryByText(/internal details/i)).not.toBeInTheDocument();
  });

  it('handles a malformed successful response safely', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      mockResponse({ query: successfulSearch.query, results: [{ title: 'Incomplete' }] }),
    );
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unexpected response/i);
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
  });

  it('announces a network failure and allows another attempt', async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error('socket details'));
    render(<SearchExperience />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not reach the search service/i,
    );
    expect(screen.queryByText(/socket details/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
  });
});
