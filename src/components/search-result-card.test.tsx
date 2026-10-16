import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { RankedSearchResult } from '@/types/search';

import { SearchResultCard } from './search-result-card';

afterEach(cleanup);

const result: RankedSearchResult = {
  title: 'Example Atlanta cocktail result',
  url: 'https://example.com/atlanta-cocktails',
  sourceHost: 'example.com',
  snippet: 'A guide to cocktail spots around Atlanta.',
  score: 12,
  matchReasons: ['Mentions lemon pepper drop martini', 'Atlanta appears in the result'],
};

describe('SearchResultCard', () => {
  it('presents result content and match reasons semantically', () => {
    render(<SearchResultCard result={result} />);

    expect(
      screen.getByRole('heading', { level: 3, name: result.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(result.sourceHost)).toBeInTheDocument();
    expect(screen.getByText(result.snippet)).toBeInTheDocument();
    expect(screen.getByText('Search match reasons')).toBeInTheDocument();
    const reasons = screen.getByRole('list', { name: /search match reasons/i });
    expect(within(reasons).getByText(result.matchReasons[0])).toBeInTheDocument();
    expect(within(reasons).getByText(result.matchReasons[1])).toBeInTheDocument();
  });

  it('uses a safe external link', () => {
    render(<SearchResultCard result={result} />);

    expect(screen.getByRole('link', { name: result.title })).toHaveAttribute(
      'href',
      result.url,
    );
    expect(screen.getByRole('link', { name: result.title })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('link', { name: result.title })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('does not link unsupported URL protocols', () => {
    render(
      <SearchResultCard
        result={{
          ...result,
          url: 'javascript:alert(document.domain)',
        }}
      />,
    );

    expect(screen.queryByRole('link', { name: result.title })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: result.title })).toBeInTheDocument();
  });
});
