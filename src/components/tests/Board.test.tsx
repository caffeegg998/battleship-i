import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import Theme from '../../theme/Theme';
import Board from '../Board';
import Game from '../../scripts/Game';
import { expect, test } from 'vitest';

test('component renders', () => {
  const game = new Game([2, 2], 4);
  const { asFragment } = render(
    <ThemeProvider theme={Theme}>
      <Board
        game={game}
        player={0}
        state={game.getCurrentPlayer.getBoard.getBoardStates}
        loop={() => {}}
        turn={0}
        init={game.getInit}
        reset={false}
      />
    </ThemeProvider>
  );
  expect(asFragment()).toMatchSnapshot();
});
