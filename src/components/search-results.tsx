import type { RankedSearchResult } from '@/types/search';

import { SearchResultCard } from './search-result-card';

export interface SearchResultsProps {
  results: RankedSearchResult[];
}

/**
 * Renders search results in their supplied ranking order or a useful empty state.
 */
export function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <section>
        <h2>No results found</h2>
        <p>Try another neighborhood or preference, or use the default Atlanta search.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="ranked-results-heading">
      <h2 id="ranked-results-heading">Ranked results</h2>
      <ol aria-label="Ranked search results">
        {results.map((result) => (
          <li key={result.url}>
            <SearchResultCard result={result} />
          </li>
        ))}
      </ol>
    </section>
  );
}
