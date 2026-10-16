export interface SearchRequest {
  refinement?: string;
}

export interface RawSearchResult {
  title: string;
  link: string;
  snippet?: string;
  position: number;
}

export interface RankedSearchResult {
  title: string;
  url: string;
  sourceHost: string;
  snippet: string;
  score: number;
  matchReasons: string[];
}

export interface SearchResponse {
  query: string;
  results: RankedSearchResult[];
}

export type SearchErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'INVALID_REQUEST'
  | 'SEARCH_UNAVAILABLE';

export interface SearchErrorResponse {
  error: {
    code: SearchErrorCode;
    message: string;
  };
}
