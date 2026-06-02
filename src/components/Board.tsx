import React, { useState, useEffect } from "react";
import Battleship from "../scripts/Battleship";
import Game from "../scripts/Game";
import { BoardContainer, Header } from "./styled_components/BoardStyles";
import ShipVisual from "./ShipVisual";

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
  playerName?: string;
  localAvatar?: string;
  seed?: number;
};

const Board = ({ player, game, state, loop, turn, init, reset, gameMode, updateBoardState, seed }: BoardProps) => {
  const [active, setActive] = useState<string>("");
  const [marked, setMarked] = useState<Battleship | null>(null);
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
  const [, setRotationToggle] = useState(false);

  const getTileClasses = (x: number, y: number) => {
    let classes = "board-tile";

    // Restore square-based visual feedback
    if (player === 0) {
      if (state.shipNotHit.some(c => c[0] === x && c[1] === y)) classes += " ship-not-hit";
    }

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

    // Preview for picked up ship (using squares)
    if (marked && hoverCoords && player === 0 && !game.getInit) {
      const [hx, hy] = hoverCoords;
      const offset = Array.from({ length: marked.getLength }, (_, k) => {
        if (marked.getDirection === 0) return [0, k];
        if (marked.getDirection === 90) return [k, 0];
        if (marked.getDirection === 180) return [0, -k];
        if (marked.getDirection === 270) return [-k, 0];
        return [0, k];
      });

      const validTiles = game.getPlayer(player).getBoard.getValidTiles;
      const isValid = offset.every(off => {
        const tx = hx - off[0];
        const ty = hy - off[1];
        return validTiles.some(v => v[0] === tx && v[1] === ty);
      });

      const isPart = offset.some(off => x === hx - off[0] && y === hy - off[1]);
      if (isPart) {
        classes += isValid ? " valid" : " invalid";
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
          board.placeShip(marked.getLength, [x, y], marked.getDirection, marked.shipType);
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
        if (e.key.toLowerCase() === 'q') {
          marked.setDirection(marked.getDirection - 90);
          setRotationToggle(prev => !prev);
        } else if (e.key.toLowerCase() === 'e') {
          marked.setDirection(marked.getDirection + 90);
          setRotationToggle(prev => !prev);
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
    if (gameMode === 'multiplayer' || gameMode === 'lobby') {
      return player === 0 ? "Your" : "Opponent's";
    }
    return `${game.getPlayer(player).getName}`;
  };

  const board = game.getPlayer(player).getBoard;
  const boardShips = board.getShips;
  const size = board.getSize;
  const heightMap = board.getHeightMap;
  const textureUrl = board.getTextureUrl;

  // Math for positioning items accurately over the grid
  const tileBaseSize = `calc((14rem + 10vw) / ${size})`;
  const tileMargin = "0.1rem";
  const cellSize = `calc(${tileBaseSize} + (${tileMargin} * 2))`;
  const paddingLeft = "1.5rem";

  return (
    <BoardContainer $size={size}>
       <div className={`board-wrapper ${active}`} onMouseLeave={() => setHoverCoords(null)} style={{ position: 'relative' }}>
         
         {/* Render Island Canvas as Full-Board Overlay - Grounded to grid */}
         {textureUrl && (
           <div style={{
              position: 'absolute',
              left: paddingLeft,
              top: 0,
              width: `calc(${size} * ${cellSize})`,
              height: `calc(${size} * ${cellSize})`,
              zIndex: 5,
              pointerEvents: 'none'
           }}>
             <img src={textureUrl} alt="Island" style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }} />
           </div>
         )}

         {/* Render ship textures as overlays */}
         {boardShips.map((ship, idx) => {
           if (player === 1 && !ship.isSunk()) return null;
           
           const [x, y] = ship.getOrigin;
           const dir = ship.getDirection;
           
           let visualX = x;
           let visualY = y;
           
           if (dir === 0) {
              visualY -= (ship.getLength - 1);
           } else if (dir === 90) {
              visualX -= (ship.getLength - 1);
           } else if (dir === 180) {
              visualY += (ship.getLength - 1);
           } else if (dir === 270) {
              visualX += (ship.getLength - 1);
           }

           return (
             <div key={idx} style={{ 
               position: 'absolute', 
               left: `calc(${paddingLeft} + (${visualY} * ${cellSize}) + ${tileMargin})`, 
               top: `calc((${visualX} * ${cellSize}) + ${tileMargin})`,
               zIndex: 6,
               pointerEvents: 'none'
             }}>
               <ShipVisual 
                 length={ship.getLength} 
                 direction={ship.getDirection} 
                 isSunk={ship.isSunk()} 
                 index={ship.shipType === "submarine" ? 1 : 0} 
                 boardSize={size}
               />
             </div>
           );
         })}

         {/* Pick-up preview texture */}
         {marked && hoverCoords && player === 0 && (() => {
           const dir = marked.getDirection;
           let visualX = hoverCoords[0];
           let visualY = hoverCoords[1];

           if (dir === 0) {
              visualY -= (marked.getLength - 1);
           } else if (dir === 90) {
              visualX -= (marked.getLength - 1);
           } else if (dir === 180) {
              visualY += (marked.getLength - 1);
           } else if (dir === 270) {
              visualX += (marked.getLength - 1);
           }
           
           return (
             <div style={{ 
               position: 'absolute', 
               left: `calc(${paddingLeft} + (${visualY} * ${cellSize}) + ${tileMargin})`, 
               top: `calc((${visualX} * ${cellSize}) + ${tileMargin})`,
               opacity: 0.5,
               pointerEvents: 'none',
               zIndex: 7
             }}>
               <ShipVisual 
                 length={marked.getLength} 
                 direction={marked.getDirection} 
                 index={marked.shipType === "submarine" ? 1 : 0} 
                 boardSize={size}
               />
             </div>
           );
         })()}

         {/* Grid Rows */}
         {game.getPlayer(player).getBoard.getTiles.map((row, i) => (
           <div key={i} className="board-row">
             {row.map((_, j) => {
               const h = heightMap[i][j];
               let classes = getTileClasses(i, j);
                if (h >= 0.3) classes += " land-tile-logic";
               
               return (
                 <div
                   key={`(${i}, ${j})`}
                   className={classes}
                   onClick={() => chooseAction(i, j)}
                   onMouseEnter={() => setHoverCoords([i, j])}
                 />
               );
             })}
           </div>
         ))}
      </div>
      <Header>{`${getHeaderName()} board`}</Header>
    </BoardContainer>
  );
}

export default Board;
