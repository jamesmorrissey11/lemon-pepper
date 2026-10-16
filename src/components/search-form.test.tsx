import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SearchForm } from './search-form';

afterEach(cleanup);

describe('SearchForm', () => {
  it('labels the optional refinement and shows an Atlanta example', () => {
    render(<SearchForm isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: /neighborhood or preference/i })).toHaveAttribute(
      'placeholder',
      expect.stringMatching(/midtown/i),
    );
  });

  it('submits a trimmed refinement from the keyboard', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);
    render(<SearchForm isSubmitting={false} onSubmit={onSubmit} />);

    const refinement = screen.getByRole('textbox', {
      name: /neighborhood or preference/i,
    });
    await user.type(refinement, '  Old Fourth Ward patio  ');
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('Old Fourth Ward patio');
  });

  it('uses the default search for a whitespace-only refinement', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SearchForm initialRefinement="Midtown" isSubmitting={false} onSubmit={onSubmit} />,
    );

    const refinement = screen.getByRole('textbox', {
      name: /neighborhood or preference/i,
    });
    await user.clear(refinement);
    await user.type(refinement, '   ');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(onSubmit).toHaveBeenCalledWith(undefined);
  });

  it('disables the controls and communicates a submitting state', () => {
    render(<SearchForm isSubmitting onSubmit={vi.fn()} />);

    expect(
      screen.getByRole('textbox', { name: /neighborhood or preference/i }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
  });
});
