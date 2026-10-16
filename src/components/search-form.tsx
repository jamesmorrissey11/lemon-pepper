'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export interface SearchFormProps {
  initialRefinement?: string;
  isSubmitting: boolean;
  onSubmit: (refinement?: string) => void | Promise<void>;
}

/**
 * Collects an optional search refinement without owning page-level request state.
 */
export function SearchForm({
  initialRefinement = '',
  isSubmitting,
  onSubmit,
}: SearchFormProps) {
  const [refinement, setRefinement] = useState(initialRefinement);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedRefinement = refinement.trim() || undefined;
    await onSubmit(normalizedRefinement);
  }

  return (
    <form aria-busy={isSubmitting} onSubmit={handleSubmit}>
      <label htmlFor="search-refinement">Neighborhood or preference (optional)</label>
      <input
        id="search-refinement"
        name="refinement"
        type="text"
        value={refinement}
        placeholder="e.g. Midtown patio"
        disabled={isSubmitting}
        onChange={(event) => setRefinement(event.target.value)}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
