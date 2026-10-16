import {
  BASE_SEARCH_QUERY,
  MAX_REFINEMENT_LENGTH,
} from '@/lib/search-config';

/**
 * Indicates that a search refinement exceeds the supported input length.
 */
export class InvalidSearchRefinementError extends Error {
  constructor() {
    super('Search refinement is too long.');
    this.name = 'InvalidSearchRefinementError';
  }
}

/**
 * Builds the fixed Atlanta cocktail query with an optional trimmed refinement.
 *
 * @param refinement - Optional neighborhood or preference to append.
 * @returns The fixed base query, optionally followed by the normalized refinement.
 * @throws InvalidSearchRefinementError When the trimmed refinement is too long.
 */
export function buildSearchQuery(refinement?: string): string {
  const normalizedRefinement = refinement?.trim();

  if (!normalizedRefinement) {
    return BASE_SEARCH_QUERY;
  }

  if (normalizedRefinement.length > MAX_REFINEMENT_LENGTH) {
    throw new InvalidSearchRefinementError();
  }

  return `${BASE_SEARCH_QUERY} ${normalizedRefinement}`;
}
