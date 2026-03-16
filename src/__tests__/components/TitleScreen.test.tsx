import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import boardReducer from '../../data/slices/boardSlice';
import hudReducer from '../../data/slices/hudSlice';
import tickerReducer from '../../data/slices/tickerSlice';
import paintPaletteReducer from '../../data/slices/paintPaletteSlice';
import TitleScreen from '../../components/TitleScreen';

jest.mock('../../analytics', () => ({
  __esModule: true,
  default: { init: jest.fn(), logEvent: jest.fn() },
}));

// Mock image imports
jest.mock('../../images/icon.png', () => 'icon.png');

const makeStore = () =>
  configureStore({
    reducer: {
      ticker: tickerReducer,
      board: boardReducer,
      hud: hudReducer,
      paintPalette: paintPaletteReducer,
    },
  });

const renderWithStore = (store = makeStore()) =>
  render(
    <Provider store={store}>
      <TitleScreen />
    </Provider>
  );

describe('TitleScreen', () => {
  it('renders welcome heading', () => {
    renderWithStore();
    expect(screen.getByText(/welcome to/i)).toBeInTheDocument();
  });

  it('renders the logo image', () => {
    renderWithStore();
    expect(screen.getByAltText('logo')).toBeInTheDocument();
  });

  it('pressing S key triggers startGame', () => {
    const store = makeStore();
    renderWithStore(store);
    fireEvent.keyDown(document, { key: 's' });
    expect(store.getState().board.game_state).toBe('Game');
  });
});
