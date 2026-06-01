import React, { useState, useEffect } from "react";
import Battleship from "../scripts/Battleship";
import Game from "../scripts/Game";
import { BoardContainer, Header } from "./styled_components/BoardStyles";

type BoardProps = {
  player: 0 | 1;
  game: Game;
  state: { [state: string]: [number, number][] };
  loop: (loc: [number, number]) => void;
  turn: 0 | 1;
  init: boolean;
  reset: boolean;
  gameMode?: 'singleplayer' | 'lobby' | 'multiplayer' | null;
  playerIndex?: number | null;
  updateBoardState?: () => void;
};

const Board = ({ player, game, state, loop, turn, init, reset, gameMode, playerIndex, updateBoardState }: BoardProps) => {
  const [active, setActive] = useState<string>("");
  const [marked, setMarked] = useState<Battleship | null>(null);
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
  const [, setRotationToggle] = useState(false);

  const getTileClasses = (x: number, y: number) => {
    let classes = "board-tile";

    const isLocalPlayer = player === 0;

    // Placed ships
    if (isLocalPlayer) {
      if (state.shipNotHit.some(c => c[0] === x && c[1] === y)) classes += " ship-not-hit";
    }

    // Hits and Misses
    if (state.shipHit.some(c => c[0] === x && c[1] === y)) {
      const tile = game.getPlayer(player).getBoard.getTiles[x][y];
      if (typeof tile !== 'boolean' && tile.isSunk()) {
        classes += " ship-sunk";
      } else {
        classes += " ship-hit";
      }
    }

    if (state.missed.some(c => c[0] === x && c[1] === y)) {
      classes += " missed";
    }

    // Preview for picked up ship
    if (marked && hoverCoords && player === 0 && !game.getInit) {
      const [hx, hy] = hoverCoords;
      const offset = Array.from({ length: marked.getLength }, (_, k) =>
        marked.getRotated ? [k, 0] : [0, k],
      );

      const validTiles = game.getPlayer(player).getBoard.getValidTiles;
      const isValid = offset.every(off => validTiles.some(v => v[0] === hx - off[0] && v[1] === hy - off[1]));

      const isPart = offset.some(off => x === hx - off[0] && y === hy - off[1]);
      const isOrigin = x === hx && y === hy;

      if (isPart) {
        if (isValid) {
          classes += isOrigin ? " valid-origin" : " valid";
        } else {
          classes += isOrigin ? " invalid-origin" : " invalid";
        }
      }
    }

    return classes;
  };

  const chooseAction = (x: number, y: number) => {
    const isOpponentBoard = player === 1;

    if (turn === 0 && isOpponentBoard && game.getInit) {
      loop([x, y]);
    } else if (player === 0 && !game.getInit) {
      const board = game.getPlayer(player).getBoard;
      if (!marked) {
        const tile = board.getTiles[x][y];
        if (typeof tile !== 'boolean') {
          const ship = board.removeShip([x, y]);
          if (ship) {
            setMarked(ship);
            if (updateBoardState) updateBoardState();
          }
        }
      } else {
        try {
          board.placeShip(marked.getLength, [x, y], marked.getRotated);
          setMarked(null);
          if (updateBoardState) updateBoardState();
        } catch (err) {
          console.error("Invalid placement", err);
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (player === 0 && !game.getInit && marked) {
        if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') {
          marked.setRotated(!marked.getRotated);
          setRotationToggle(prev => !prev); // Force React re-render
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, marked, player]);

  useEffect(() => {
    if (!game.getInit) {
      setActive('active');
    } else if (turn === 1 - player) {
      setActive('active');
    } else {
      setActive('');
    }
  }, [turn, init, game, player]);

  useEffect(() => {
    if (reset) {
      setMarked(null);
      setHoverCoords(null);
    }
  }, [reset]);

  const getHeaderName = () => {
    if (gameMode === 'multiplayer') {
      return player === 0 ? "Your" : "Opponent's";
    }
    return `${game.getPlayer(player).getName}`;
  };

  return (
    <BoardContainer>
       <div className={`board-wrapper ${active}`} onMouseLeave={() => setHoverCoords(null)}>
         {game.getPlayer(player).getBoard.getTiles.map((row, i) => (
           <div key={i} className="board-row">
             {row.map((_, j) => (
               <div
                 key={`(${i}, ${j})`}
                 data-x={`${i}`}
                 data-y={`${j}`}
                 data-player={player}
                 className={getTileClasses(i, j)}
                 onClick={() => chooseAction(i, j)}
                 onMouseEnter={() => setHoverCoords([i, j])}
               />
             ))}
           </div>
         ))}
      </div>
      <Header>{`${getHeaderName()} board`}</Header>
    </BoardContainer>
  );
}

export default Board;
