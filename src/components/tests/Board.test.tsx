import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import Theme from '../../theme/Theme';
import Board from '../Board';
import Game from '../../scripts/Game';
import { expect, test } from 'vitest';

test('component renders', () => {
  const game = new Game([2, 2], 4);
  // Clear random ships and place them deterministically
  const board = game.getPlayer(0).getBoard;
  board.clearShips();
  board.placeShip(2, [0, 1], 0, 'destroyer');
  board.placeShip(2, [2, 2], 270, 'destroyer');
  // Force re-initialize state
  const { asFragment } = render(
    <ThemeProvider theme={Theme}>
      <Board
        game={game}
        player={0}
        state={board.getBoardStates}
        loop={() => {}}
        turn={0}
        init={game.getInit}
        reset={false}
      />
    </ThemeProvider>
  );
  expect(asFragment()).toMatchSnapshot();
});
