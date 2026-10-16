import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from './page';

describe('Home', () => {
  it('describes the focused Atlanta cocktail search', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: 'Find a lemon pepper drop martini' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/confirm current menu availability/i)).toBeInTheDocument();
  });
});
