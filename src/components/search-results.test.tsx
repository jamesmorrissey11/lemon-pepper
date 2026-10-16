import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { RankedSearchResult } from '@/types/search';

import { SearchResults } from './search-results';

afterEach(cleanup);

const results: RankedSearchResult[] = [
  {
    title: 'First ranked result',
    url: 'https://first.example/menu',
    sourceHost: 'first.example',
    snippet: 'First result snippet.',
    score: 20,
    matchReasons: ['Exact phrase match'],
  },
  {
    title: 'Second ranked result',
    url: 'https://second.example/drinks',
    sourceHost: 'second.example',
    snippet: 'Second result snippet.',
    score: 10,
    matchReasons: ['Atlanta match'],
  },
];

describe('SearchResults', () => {
  it('renders results in the supplied ranked order', () => {
    render(<SearchResults results={results} />);

    const list = screen.getByRole('list', { name: /ranked search results/i });
    const titles = within(list).getAllByRole('heading', { level: 3 });

    expect(titles.map((title) => title.textContent)).toEqual([
      results[0].title,
      results[1].title,
    ]);
  });

  it('renders a useful empty state when there are no results', () => {
    render(<SearchResults results={[]} />);

    expect(screen.getByRole('heading', { name: /no results found/i })).toBeInTheDocument();
    expect(screen.getByText(/try another neighborhood or preference/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
