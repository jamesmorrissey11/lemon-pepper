import { describe, expect, it } from 'vitest';

import {
  BASE_SEARCH_QUERY,
  MAX_REFINEMENT_LENGTH,
} from '@/lib/search-config';

import {
  InvalidSearchRefinementError,
  buildSearchQuery,
} from './build-query';

describe('buildSearchQuery', () => {
  it.each([undefined, '', '   '])(
    'uses the base query when the refinement is %s',
    (refinement) => {
      expect(buildSearchQuery(refinement)).toBe(BASE_SEARCH_QUERY);
    },
  );

  it('trims and appends a refinement to the fixed query', () => {
    expect(buildSearchQuery('  Midtown patio  ')).toBe(
      `${BASE_SEARCH_QUERY} Midtown patio`,
    );
  });

  it('accepts a refinement at the maximum length', () => {
    const refinement = 'x'.repeat(MAX_REFINEMENT_LENGTH);

    expect(buildSearchQuery(refinement)).toBe(
      `${BASE_SEARCH_QUERY} ${refinement}`,
    );
  });

  it('rejects a trimmed refinement over the maximum length', () => {
    const refinement = `  ${'x'.repeat(MAX_REFINEMENT_LENGTH + 1)}  `;

    expect(() => buildSearchQuery(refinement)).toThrow(
      InvalidSearchRefinementError,
    );
  });
});
