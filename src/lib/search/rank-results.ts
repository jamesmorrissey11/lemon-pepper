import { MAX_RESULTS } from '@/lib/search-config';
import type { RankedSearchResult, RawSearchResult } from '@/types/search';

import {
  normalizeSearchResult,
  type NormalizedSearchResult,
} from './normalize-result';

/*
 * Relevance weights are intentionally explicit so every score can be explained:
 * - provider position: 19 points for position 1, decreasing to 0 at position 20
 * - exact cocktail phrase: +50
 * - individual cocktail terms when the exact phrase is absent: +6 each
 * - Atlanta: +30
 * - venue context: +20
 * - menu or drinks context: +15
 * - recipe or how-to context: -45
 */
const SCORE_WEIGHTS = {
  exactCocktailPhrase: 50,
  cocktailTerm: 6,
  atlanta: 30,
  venueContext: 20,
  menuContext: 15,
  recipeContext: -45,
} as const;

const EXACT_COCKTAIL_PHRASE = /\blemon[\s-]+pepper[\s-]+drop[\s-]+martini\b/i;
const COCKTAIL_TERMS = ['lemon', 'pepper', 'drop', 'martini'] as const;
const VENUE_TERMS = [
  'bar',
  'bistro',
  'hotel',
  'lounge',
  'restaurant',
  'rooftop',
  'venue',
] as const;
const MENU_TERMS = ['cocktail', 'cocktails', 'drink', 'drinks', 'menu'] as const;
const RECIPE_PATTERNS = [
  /\brecipe\b/i,
  /\bhow to\b/i,
  /\bingredients?\b/i,
  /\bdirections?\b/i,
  /\bmake at home\b/i,
  /\bhomemade\b/i,
] as const;

interface ScoredResult {
  result: NormalizedSearchResult;
  score: number;
  matchReasons: string[];
  inputIndex: number;
}

function includesTerm(text: string, term: string): boolean {
  return new RegExp(`\\b${term}\\b`, 'i').test(text);
}

function findTerms(
  text: string,
  terms: readonly string[],
): string[] {
  return terms.filter((term) => includesTerm(text, term));
}

function scoreResult(
  result: NormalizedSearchResult,
  inputIndex: number,
): ScoredResult {
  const text = `${result.title} ${result.snippet}`;
  const positionScore = Math.max(0, 20 - result.position);
  const matchReasons = [
    positionScore > 0
      ? `Provider position ${result.position} contributes ${positionScore} baseline points.`
      : 'Provider position supplies a deterministic tie-break when its baseline score is zero.',
  ];
  let score = positionScore;

  if (EXACT_COCKTAIL_PHRASE.test(text)) {
    score += SCORE_WEIGHTS.exactCocktailPhrase;
    matchReasons.push('The exact cocktail phrase “lemon pepper drop martini” appears in the result text.');
  } else {
    const cocktailTerms = findTerms(text, COCKTAIL_TERMS);

    if (cocktailTerms.length > 0) {
      score += cocktailTerms.length * SCORE_WEIGHTS.cocktailTerm;
      matchReasons.push(`Cocktail terms appear in the result text: ${cocktailTerms.join(', ')}.`);
    }
  }

  if (includesTerm(text, 'atlanta')) {
    score += SCORE_WEIGHTS.atlanta;
    matchReasons.push('Atlanta appears in the result text.');
  }

  const venueTerms = findTerms(text, VENUE_TERMS);

  if (venueTerms.length > 0) {
    score += SCORE_WEIGHTS.venueContext;
    matchReasons.push(`Venue context appears in the result text: ${venueTerms.join(', ')}.`);
  }

  const menuTerms = findTerms(text, MENU_TERMS);

  if (menuTerms.length > 0) {
    score += SCORE_WEIGHTS.menuContext;
    matchReasons.push(`Menu or drinks context appears in the result text: ${menuTerms.join(', ')}.`);
  }

  if (RECIPE_PATTERNS.some((pattern) => pattern.test(text))) {
    score += SCORE_WEIGHTS.recipeContext;
    matchReasons.push('Recipe or how-to language lowers this result’s relevance.');
  }

  return {
    result,
    score,
    matchReasons,
    inputIndex,
  };
}

function compareResults(left: ScoredResult, right: ScoredResult): number {
  return (
    right.score - left.score ||
    left.result.position - right.result.position ||
    left.inputIndex - right.inputIndex
  );
}

/**
 * Normalizes, deduplicates, and ranks raw provider results using documented
 * text-relevance weights and stable provider-order tie-breaking.
 *
 * @param results - Raw provider results to rank without mutation.
 * @returns Up to eight deterministic, explainable ranked results.
 */
export function rankSearchResults(
  results: RawSearchResult[],
): RankedSearchResult[] {
  const scoredResults = results
    .map((result, inputIndex) => {
      const normalizedResult = normalizeSearchResult(result);

      return normalizedResult
        ? scoreResult(normalizedResult, inputIndex)
        : null;
    })
    .filter((result): result is ScoredResult => result !== null)
    .sort(compareResults);
  const canonicalUrls = new Set<string>();
  const rankedResults: RankedSearchResult[] = [];

  for (const scoredResult of scoredResults) {
    if (canonicalUrls.has(scoredResult.result.canonicalUrl)) {
      continue;
    }

    canonicalUrls.add(scoredResult.result.canonicalUrl);
    rankedResults.push({
      title: scoredResult.result.title,
      url: scoredResult.result.url,
      sourceHost: scoredResult.result.sourceHost,
      snippet: scoredResult.result.snippet,
      score: scoredResult.score,
      matchReasons: scoredResult.matchReasons,
    });

    if (rankedResults.length === MAX_RESULTS) {
      break;
    }
  }

  return rankedResults;
}
