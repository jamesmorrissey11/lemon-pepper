import { describe, expect, it } from 'vitest';

import type { RawSearchResult } from '@/types/search';

import { rankSearchResults } from './rank-results';

function result(overrides: Partial<RawSearchResult> = {}): RawSearchResult {
  return {
    title: 'Example result',
    link: 'https://example.com/result',
    snippet: 'Example snippet',
    position: 1,
    ...overrides,
  };
}

describe('rankSearchResults', () => {
  it('ranks a relevant Atlanta venue above an earlier recipe result', () => {
    const ranked = rankSearchResults([
      result({
        title: 'Lemon pepper drop martini recipe',
        link: 'https://recipes.example.com/lemon-pepper-drop',
        snippet: 'How to make this cocktail at home with ingredients and directions.',
        position: 1,
      }),
      result({
        title: 'Lemon Pepper Drop Martini in Atlanta',
        link: 'https://venue.example.com/cocktails',
        snippet: 'Explore the cocktail menu from this Atlanta restaurant and bar.',
        position: 8,
      }),
    ]);

    expect(ranked[0]?.sourceHost).toBe('venue.example.com');
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
    expect(ranked[0]?.matchReasons).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/exact cocktail phrase/i),
        expect.stringMatching(/atlanta/i),
        expect.stringMatching(/venue context/i),
        expect.stringMatching(/menu or drinks context/i),
      ]),
    );
    expect(ranked[1]?.matchReasons).toContain(
      'Recipe or how-to language lowers this result’s relevance.',
    );
    expect(ranked[0]?.matchReasons.join(' ')).not.toMatch(/available|serves|offers/i);
  });

  it('collapses canonical URL duplicates and keeps the strongest result', () => {
    const ranked = rankSearchResults([
      result({
        title: 'Restaurant home',
        link: 'https://example.com/menu/?utm_source=search#cocktails',
        position: 1,
      }),
      result({
        title: 'Atlanta Lemon Pepper Drop Martini',
        link: 'https://EXAMPLE.com/menu',
        snippet: 'Cocktail menu at an Atlanta lounge.',
        position: 2,
      }),
    ]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({
      title: 'Atlanta Lemon Pepper Drop Martini',
      url: 'https://example.com/menu',
      sourceHost: 'example.com',
    });
  });

  it('omits invalid URLs and blank titles', () => {
    const ranked = rankSearchResults([
      result({ title: ' ', link: 'https://example.com/blank-title' }),
      result({ title: 'Relative URL', link: '/cocktails' }),
      result({ title: 'Unsafe URL', link: 'javascript:alert(1)' }),
      result({ title: 'Valid title', link: 'https://example.com/valid' }),
    ]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.title).toBe('Valid title');
  });

  it('uses provider position and then input order to break score ties', () => {
    const ranked = rankSearchResults([
      result({
        title: 'Second by provider',
        link: 'https://example.com/second',
        position: 50,
      }),
      result({
        title: 'First by provider',
        link: 'https://example.com/first',
        position: 40,
      }),
      result({
        title: 'Stable first equal',
        link: 'https://example.com/stable-first',
        position: 60,
      }),
      result({
        title: 'Stable second equal',
        link: 'https://example.com/stable-second',
        position: 60,
      }),
    ]);

    expect(ranked.map(({ title }) => title)).toEqual([
      'First by provider',
      'Second by provider',
      'Stable first equal',
      'Stable second equal',
    ]);
    expect(new Set(ranked.map(({ score }) => score))).toEqual(new Set([0]));
  });

  it('returns an empty array for empty input', () => {
    expect(rankSearchResults([])).toEqual([]);
  });

  it('returns at most eight results', () => {
    const ranked = rankSearchResults(
      Array.from({ length: 12 }, (_, index) =>
        result({
          title: `Result ${index + 1}`,
          link: `https://example.com/result-${index + 1}`,
          position: index + 1,
        }),
      ),
    );

    expect(ranked).toHaveLength(8);
    expect(ranked.map(({ title }) => title)).toEqual(
      Array.from({ length: 8 }, (_, index) => `Result ${index + 1}`),
    );
  });

  it('produces identical output for identical input without mutating it', () => {
    const input = [
      result({
        title: '  Atlanta   cocktail menu  ',
        link: 'https://example.com/menu?b=2&a=1',
        snippet: '  A local   bar  ',
        position: 3,
      }),
    ];
    const snapshot = structuredClone(input);

    expect(rankSearchResults(input)).toEqual(rankSearchResults(input));
    expect(input).toEqual(snapshot);
  });
});
