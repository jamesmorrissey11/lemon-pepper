import type { RankedSearchResult } from '@/types/search';

export interface SearchResultCardProps {
  result: RankedSearchResult;
}

function getSafeExternalUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Presents one ranked search result and the signals behind its match.
 */
export function SearchResultCard({ result }: SearchResultCardProps) {
  const safeUrl = getSafeExternalUrl(result.url);

  return (
    <article>
      <h3>
        {safeUrl ? (
          <a href={safeUrl} target="_blank" rel="noopener noreferrer">
            {result.title}
          </a>
        ) : (
          result.title
        )}
      </h3>
      <p>{result.sourceHost}</p>
      <p>{result.snippet}</p>
      {result.matchReasons.length > 0 ? (
        <section>
          <h4>Search match reasons</h4>
          <ul aria-label="Search match reasons">
            {result.matchReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
