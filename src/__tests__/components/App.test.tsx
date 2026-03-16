import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../App';

// Mock geolocation since Game.tsx calls navigator.geolocation.getCurrentPosition
beforeAll(() => {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: jest.fn(),
    },
    configurable: true,
  });
});

// Mock Firebase analytics used in analytics.ts
jest.mock('../../analytics', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    logEvent: jest.fn(),
  },
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('shows the title screen by default', () => {
    render(<App />);
    // TitleScreen should be visible on initial render (GameState.Title)
    expect(document.querySelector('.App')).toBeInTheDocument();
  });
});
