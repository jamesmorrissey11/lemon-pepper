import type { RawSearchResult } from '@/types/search';

const TRACKING_PARAMETERS = new Set(['fbclid', 'gclid', 'msclkid']);

export interface NormalizedSearchResult {
  title: string;
  url: string;
  canonicalUrl: string;
  sourceHost: string;
  snippet: string;
  position: number;
}

interface NormalizedUrl {
  url: string;
  canonicalUrl: string;
  sourceHost: string;
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeUrl(value: string): NormalizedUrl | null {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    return null;
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    return null;
  }

  parsedUrl.hash = '';

  for (const parameter of [...parsedUrl.searchParams.keys()]) {
    if (parameter.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(parameter.toLowerCase())) {
      parsedUrl.searchParams.delete(parameter);
    }
  }

  parsedUrl.searchParams.sort();

  if (parsedUrl.pathname !== '/') {
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '');
  }

  const sourceHost = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  const canonicalUrl = `${sourceHost}${parsedUrl.pathname}${parsedUrl.search}`;

  return {
    url: parsedUrl.toString(),
    canonicalUrl,
    sourceHost,
  };
}

/**
 * Sanitizes a provider result into the fields used by deterministic ranking.
 *
 * @param result - Raw result supplied by the search provider.
 * @returns A normalized result, or null when its title or URL is unusable.
 */
export function normalizeSearchResult(
  result: RawSearchResult,
): NormalizedSearchResult | null {
  if (typeof result.title !== 'string' || typeof result.link !== 'string') {
    return null;
  }

  const title = collapseWhitespace(result.title);
  const normalizedUrl = normalizeUrl(result.link);

  if (!title || !normalizedUrl) {
    return null;
  }

  const snippet =
    typeof result.snippet === 'string' ? collapseWhitespace(result.snippet) : '';
  const position =
    Number.isFinite(result.position) && result.position > 0
      ? Math.floor(result.position)
      : Number.MAX_SAFE_INTEGER;

  return {
    title,
    ...normalizedUrl,
    snippet,
    position,
  };
}
