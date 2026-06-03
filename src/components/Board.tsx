import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
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
  const [rotationToggle, setRotationToggle] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const zKeyRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const minimapRef = useRef<HTMLDivElement | null>(null);
  const [baseBoardSize, setBaseBoardSize] = useState({ width: 0, height: 0 });
  const [viewportScroll, setViewportScroll] = useState({ left: 0, top: 0 });
  const [minimapViewport, setMinimapViewport] = useState({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });

  const board = game.getPlayer(player).getBoard;
  const boardShips = board.getShips;
  const size = board.getSize;
  const heightMap = board.getHeightMap;
  const textureUrl = board.getTextureUrl;

  const coordKey = (x: number, y: number) => `${x},${y}`;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const getBoardMetrics = useCallback(() => {
    const wrapper = boardWrapperRef.current;
    if (!wrapper) return null;

    const mapWidth = Math.max(1, wrapper.scrollWidth);
    const mapHeight = Math.max(1, wrapper.scrollHeight);

    return {
      axisWidth: 0,
      mapWidth,
      mapHeight,
      scaledAxisWidth: 0,
      scaledMapWidth: mapWidth,
      scaledMapHeight: mapHeight,
    };
  }, []);

  const getColumnLabel = (index: number) => {
    let n = index + 1;
    let label = "";
    while (n > 0) {
      n -= 1;
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26);
    }
    return label;
  };

  const stateSets = useMemo(() => ({
    shipNotHit: new Set((state.shipNotHit || []).map(([x, y]) => coordKey(x, y))),
    shipHit: new Set((state.shipHit || []).map(([x, y]) => coordKey(x, y))),
    missed: new Set((state.missed || []).map(([x, y]) => coordKey(x, y))),
    landHit: new Set((state.landHit || []).map(([x, y]) => coordKey(x, y))),
  }), [state]);

  const validTileSet = useMemo(() => {
    if (!marked || player !== 0 || game.getInit) return new Set<string>();
    return new Set(board.getValidTiles.map(([x, y]) => coordKey(x, y)));
  }, [board, game, marked, player, stateSets]);

  const placementPreview = useMemo(() => {
    if (!marked || !hoverCoords || player !== 0 || game.getInit) {
      return { cells: [] as [number, number][], isValid: false };
    }

    const [hx, hy] = hoverCoords;
    const offset = Array.from({ length: marked.getLength }, (_, k) => {
      if (marked.getDirection === 0) return [0, k];
      if (marked.getDirection === 90) return [k, 0];
      if (marked.getDirection === 180) return [0, -k];
      if (marked.getDirection === 270) return [-k, 0];
      return [0, k];
    });

    const cells = offset.map(([ox, oy]) => [hx - ox, hy - oy] as [number, number]);
    const isValid = cells.every(([x, y]) => validTileSet.has(coordKey(x, y)));

    return { cells, isValid };
  }, [game, hoverCoords, marked, player, rotationToggle, validTileSet]);

  const getTileClasses = (x: number, y: number) => {
    let classes = "board-tile";

    // Restore square-based visual feedback
    const key = coordKey(x, y);

    if (player === 0) {
      if (stateSets.shipNotHit.has(key)) classes += " ship-not-hit";
    }

    if (stateSets.shipHit.has(key)) {
      const tile = game.getPlayer(player).getBoard.getTiles[x][y];
      if (typeof tile !== 'boolean' && tile.isSunk()) {
        classes += " ship-sunk";
      } else {
        classes += " ship-hit";
      }
    }

    if (stateSets.missed.has(key)) {
      classes += " missed";
    }

    if (stateSets.landHit.has(key)) {
      classes += " land-hit";
    }

    return classes;
  };

  const chooseAction = useCallback((x: number, y: number) => {
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
  }, [game, loop, marked, player, turn, updateBoardState]);

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

  const updateMinimapViewport = useCallback(() => {
    const viewport = viewportRef.current;
    const metrics = getBoardMetrics();
    if (!viewport || !metrics) return;

    setViewportScroll({
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    });

    const visibleLeft = viewport.scrollLeft;
    const visibleTop = viewport.scrollTop;
    const visibleRight = visibleLeft + viewport.clientWidth;
    const visibleBottom = visibleTop + viewport.clientHeight;

    const mapRight = metrics.scaledMapWidth;
    const mapBottom = metrics.scaledMapHeight;

    const clippedLeft = clamp(visibleLeft, 0, mapRight);
    const clippedTop = clamp(visibleTop, 0, mapBottom);
    const clippedRight = clamp(visibleRight, 0, mapRight);
    const clippedBottom = clamp(visibleBottom, 0, mapBottom);
    const clippedWidth = Math.max(0, clippedRight - clippedLeft);
    const clippedHeight = Math.max(0, clippedBottom - clippedTop);

    setMinimapViewport({
      left: (clippedLeft / metrics.scaledMapWidth) * 100,
      top: (clippedTop / metrics.scaledMapHeight) * 100,
      width: (clippedWidth / metrics.scaledMapWidth) * 100,
      height: (clippedHeight / metrics.scaledMapHeight) * 100,
    });
  }, [getBoardMetrics]);

  useLayoutEffect(() => {
    const wrapper = boardWrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      setBaseBoardSize({
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      });
    };

    updateSize();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [reset, size]);

  useEffect(() => {
    const schedule = window.requestAnimationFrame || window.setTimeout;
    const frame = schedule(updateMinimapViewport);
    return () => {
      if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(frame);
      } else {
        window.clearTimeout(frame);
      }
    };
  }, [mapZoom, reset, size, updateMinimapViewport]);

  const handleMinimapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const minimap = minimapRef.current;
    const metrics = getBoardMetrics();
    if (!viewport || !minimap || !metrics) return;

    const rect = minimap.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left) / rect.width;
    const ratioY = (event.clientY - rect.top) / rect.height;

    const targetX = ratioX * metrics.scaledMapWidth;
    const targetY = ratioY * metrics.scaledMapHeight;

    viewport.scrollLeft = Math.max(0, targetX - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, targetY - viewport.clientHeight / 2);
    updateMinimapViewport();
  }, [getBoardMetrics, updateMinimapViewport]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z') zKeyRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z') zKeyRef.current = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      if (!zKeyRef.current) return;
      e.preventDefault();

      const currentZoom = mapZoom;
      const nextZoom = Math.max(1, Math.min(3, Number((currentZoom + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(1))));
      if (nextZoom === currentZoom) return;

      const rect = viewport.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      const contentX = (viewport.scrollLeft + pointerX) / currentZoom;
      const contentY = (viewport.scrollTop + pointerY) / currentZoom;

      setMapZoom(nextZoom);
      requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(0, contentX * nextZoom - pointerX);
        viewport.scrollTop = Math.max(0, contentY * nextZoom - pointerY);
        updateMinimapViewport();
      });
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [mapZoom, updateMinimapViewport]);

  const getHeaderName = () => {
    if (gameMode === 'multiplayer' || gameMode === 'lobby') {
      return player === 0 ? "Your" : "Opponent's";
    }
    return `${game.getPlayer(player).getName}`;
  };

  // Math for positioning items accurately over the grid
  const tileBaseSize = `calc(((14rem + 10vw) * ${mapZoom}) / ${size})`;
  const tileMargin = "0.1rem";
  const cellSize = `calc(${tileBaseSize} + (${tileMargin} * 2))`;
  const baseCellSize = `calc((14rem + 10vw) / ${size} + (${tileMargin} * 2))`;
  const paddingLeft = "0rem";
  const axisLabelLeft = "1.5rem";
  const baseBoardWidth = `calc(${size} * ${cellSize})`;
  const XTitleWidth = `calc((${size} + 1) * ${cellSize})`;
  const baseBoardHeight = `calc(${size} * ${cellSize})`;
  const viewportWidth = `calc(${size} * ${baseCellSize})`;
  const viewportHeight = `calc(${size} * ${baseCellSize})`;
  const boardViewportStyle = {
    width: viewportWidth,
    height: viewportHeight,
    overflow: mapZoom > 1 ? 'auto' : 'visible',
  } as React.CSSProperties;
  const boardZoomSpaceStyle = {
    width: baseBoardWidth,
    height: baseBoardHeight,
    position: 'relative',
  } as React.CSSProperties;
  const boardWrapperStyle = {
    position: 'relative',
    width: baseBoardWidth,
    height: baseBoardHeight,
  } as React.CSSProperties;

  const gridRows = useMemo(() => (
    board.getTiles.map((row, i) => (
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
              onMouseEnter={() => {
                if (marked) setHoverCoords([i, j]);
              }}
            />
          );
        })}
      </div>
    ))
  ), [board, chooseAction, heightMap, marked, stateSets]);
  const yAxisLabels = useMemo(() => (
    Array.from({ length: size }, (_, row) => (
      <div
        key={`axis-y-${row}`}
        className="board-axis-label board-axis-y-label"
        style={{
          top: `calc(((${row} * ${cellSize}) + (${cellSize} / 2)) - ${viewportScroll.top}px)`,
          transform: `translateY(-50%)`,
        }}
      >
        {row + 1}
      </div>
    ))
  ), [mapZoom, cellSize, size, viewportScroll.top]);

  const xAxisLabels = useMemo(() => (
    Array.from({ length: size }, (_, col) => (
      <div
        key={`axis-x-${col}`}
        className="board-axis-label board-axis-x-label"
        style={{
          left: `calc(${axisLabelLeft} + (${col} * ${cellSize}) + ((${cellSize}) / 2) - ${viewportScroll.left}px)`,
          transform: `translateX(-50%)`,
        }}
      >
        {getColumnLabel(col)}
      </div>
    ))
  ), [mapZoom, cellSize, axisLabelLeft, size, viewportScroll.left]);

  const yAxisLayerStyle = {
    transformOrigin: 'top left',
  } as React.CSSProperties;

  const xAxisLayerStyle = {
    transformOrigin: 'top left',
  } as React.CSSProperties;

  return (
    <BoardContainer $size={size} $zoom={mapZoom}>
      <div ref={shellRef} className="board-viewport-shell">
        <div className="board-axis-y-viewport" style={{ height: `calc(${size} * ${cellSize})`,maxHeight: `calc(30rem)`  }}>
          <div className="board-axis-y-layer" style={yAxisLayerStyle}>
            {yAxisLabels}
          </div>
        </div>
        <div className="board-axis-x-viewport" style={{ width: XTitleWidth,maxWidth: `calc(26.25rem + 3.75vw)` }}>
          <div className="board-axis-x-layer" style={xAxisLayerStyle}>
            {xAxisLabels}
          </div>
        </div>
        <div
          ref={viewportRef}
          className={`board-viewport ${mapZoom > 1 ? 'zoomed' : ''}`}
          onScroll={updateMinimapViewport}
          style={boardViewportStyle}
        >
          <div className="board-zoom-space" style={boardZoomSpaceStyle}>
       <div ref={boardWrapperRef} className={`board-wrapper ${active}`} onMouseLeave={() => setHoverCoords(null)} style={boardWrapperStyle}>
         
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
                  zoom={mapZoom}
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

          {/* Ship hit/sunk markers above texture */}
          {state.shipHit?.map(([r, c]) => {
            const tile = game.getPlayer(player).getBoard.getTiles[r][c];
            const isSunk = typeof tile !== 'boolean' && tile.isSunk();
            return (
              <div key={`hit-${r}-${c}`} style={{
                position: 'absolute',
                left: `calc(${paddingLeft} + (${c} * ${cellSize}))`,
                top: `calc((${r} * ${cellSize}))`,
                width: cellSize,
                height: cellSize,
                zIndex: 8,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
  width: '85%',
  height: '85%',
  borderRadius: '2px',
  // Sử dụng màu RGBA để chỉ làm mờ nền (0.5 là độ mờ 50%)
  backgroundColor: isSunk ? 'rgba(200, 107, 133, 0.5)' : 'rgba(187, 187, 187, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white', // Chữ X vẫn sẽ hiển thị rõ 100%
  fontWeight: 1000,
  fontSize: 'clamp(8px, 1.2vw, 16px)',
  fontFamily: "'Font Awesome 5 Free', sans-serif",
}}>
  ✕
</div>
              </div>
            );
          })}

          {/* Land hit markers above texture */}
          {state.landHit?.map(([r, c]) => (
            <div key={`land-${r}-${c}`} style={{
              position: 'absolute',
              left: `calc(${paddingLeft} + (${c} * ${cellSize}))`,
              top: `calc((${r} * ${cellSize}))`,
              width: cellSize,
              height: cellSize,
              zIndex: 9,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '40%',
                height: '40%',
                borderRadius: '50%',
                backgroundColor: '#8B5E3C',
                border: '2px solid #FFE0B2',
                boxSizing: 'border-box',
              }} />
            </div>
          ))}

          {/* Hover highlight above everything */}
          {hoverCoords && active && (
            <div style={{
              position: 'absolute',
              left: `calc(${paddingLeft} + (${hoverCoords[1]} * ${cellSize}))`,
              top: `calc((${hoverCoords[0]} * ${cellSize}))`,
              width: cellSize,
              height: cellSize,
              zIndex: 10,
              border: '2px solid white',
              borderRadius: '3px',
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }} />
          )}

          {/* Placement validity overlay. Kept out of the grid so mouse movement does not rebuild every tile. */}
          {placementPreview.cells.map(([r, c]) => (
            <div key={`preview-${r}-${c}`} style={{
              position: 'absolute',
              left: `calc(${paddingLeft} + (${c} * ${cellSize}))`,
              top: `calc((${r} * ${cellSize}))`,
              width: cellSize,
              height: cellSize,
              zIndex: 11,
              pointerEvents: 'none',
              backgroundColor: placementPreview.isValid ? 'rgba(46, 204, 113, 0.65)' : 'rgba(231, 76, 60, 0.65)',
              borderRadius: '3px',
              boxSizing: 'border-box',
            }} />
          ))}

          {/* Grid Rows */}
         {gridRows}
      </div>
          </div>
        </div>
        {mapZoom > 1 && (
          <div
            ref={minimapRef}
            className="board-minimap"
            onClick={handleMinimapClick}
            title="Jump to map area"
          >
            {textureUrl && <img src={textureUrl} alt="" />}
            <div className="board-minimap-grid" />
            <div
              className="board-minimap-viewport"
              style={{
                left: `${minimapViewport.left}%`,
                top: `${minimapViewport.top}%`,
                width: `${minimapViewport.width}%`,
                height: `${minimapViewport.height}%`,
              }}
            />
          </div>
        )}
      </div>
      <Header>{`${getHeaderName()} board`}</Header>
    </BoardContainer>
  );
}

export default Board;
