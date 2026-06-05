import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import Battleship from "../scripts/Battleship";
import Game from "../scripts/Game";
import { BoardContainer } from "./styled_components/BoardStyles";
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
  maxBoardPixels?: number;
};

const Board = ({ player, game, state, loop, turn, init, reset, gameMode, playerIndex, updateBoardState, seed, maxBoardPixels }: BoardProps) => {
  const [active, setActive] = useState<string>("");
  const [marked, setMarked] = useState<Battleship | null>(null);
  const [rotationToggle, setRotationToggle] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [hoverTile, setHoverTile] = useState<{ x: number, y: number } | null>(null);
  const zKeyRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const boardWrapperRef = useRef<HTMLDivElement | null>(null);
  const hoverOverlayRef = useRef<HTMLDivElement | null>(null);
  const previewOverlayRef = useRef<HTMLDivElement | null>(null);
  const minimapRef = useRef<HTMLDivElement | null>(null);
  const lastHoverCoordsRef = useRef<[number, number] | null>(null);
  const activeRef = useRef(false);
  const markedRef = useRef<Battleship | null>(null);
  const validTileSetRef = useRef<Set<string>>(new Set());
  const previewCellRefs = useRef<HTMLDivElement[]>([]);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerEventRef = useRef<PointerEvent | null>(null);
  const [viewportScroll, setViewportScroll] = useState({ left: 0, top: 0 });
  const [minimapViewport, setMinimapViewport] = useState({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });
  const zoomScrollRef = useRef<{left: number, top: number} | null>(null);

  const board = game.getPlayer(player).getBoard;
  const boardShips = board.getShips;
  const size = board.getSize;
  const heightMap = board.getHeightMap;
  const textureUrl = board.getTextureUrl;
  const isLocalBoard = player === (playerIndex ?? 0);

  const coordKey = (x: number, y: number) => `${x},${y}`;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const clearHoverPreview = useCallback(() => {
    pendingPointerEventRef.current = null;
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    lastHoverCoordsRef.current = null;
    setHoverTile(null);
    const hover = hoverOverlayRef.current;
    if (hover) hover.style.display = 'none';
    previewCellRefs.current.forEach((cell) => {
      cell.style.display = 'none';
    });
  }, []);

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
    if (!marked || !isLocalBoard || game.getInit) return new Set<string>();
    return new Set(board.getValidTiles.map(([x, y]) => coordKey(x, y)));
  }, [board, game, marked, player, playerIndex, stateSets]);

  useEffect(() => {
    markedRef.current = marked;
  }, [marked]);

  useEffect(() => {
    activeRef.current = active === 'active';
  }, [active]);

  useEffect(() => {
    validTileSetRef.current = validTileSet;
  }, [validTileSet]);

  const getTileClasses = (x: number, y: number) => {
    let classes = "board-tile";

    // Restore square-based visual feedback
    const key = coordKey(x, y);

    if (isLocalBoard) {
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
    const isOpponentBoard = !isLocalBoard;

    if (turn === (playerIndex ?? 0) && isOpponentBoard && game.getInit) {
      loop([x, y]);
    } else if (isLocalBoard && !game.getInit) {
      const board = game.getPlayer(player).getBoard;
      if (!marked) {
        const tile = board.getTiles[x][y];
        if (typeof tile !== 'boolean') {
          const ship = board.removeShip([x, y]);
          if (ship) {
    lastHoverCoordsRef.current = [x, y];
    setHoverTile({ x, y });
            setMarked(ship);
            if (updateBoardState) updateBoardState();
          }
        }
      } else {
        try {
          const placeLen = marked.getLength === 5 && marked.getDirection % 90 !== 0 ? 4 : marked.getLength;
          board.placeShip(marked.getLength, [x, y], marked.getDirection, marked.shipType, placeLen);
          setMarked(null);
          clearHoverPreview();
          if (updateBoardState) updateBoardState();
        } catch {
          return;
        }
      }
    }
  }, [game, loop, marked, player, playerIndex, turn, updateBoardState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocalBoard && !game.getInit && marked) {
        if (e.key.toLowerCase() === 'q') {
          marked.setDirection(marked.getDirection - 45);
          setRotationToggle(prev => !prev);
        } else if (e.key.toLowerCase() === 'e') {
          marked.setDirection(marked.getDirection + 45);
          setRotationToggle(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, marked, player, playerIndex]);

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
      clearHoverPreview();
    }
  }, [reset, clearHoverPreview]);

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

      // Clamp pointer to visible content area
      const maxPx = Math.max(0, Math.min(viewport.scrollWidth - viewport.scrollLeft, viewport.clientWidth) - 1);
      const maxPy = Math.max(0, Math.min(viewport.scrollHeight - viewport.scrollTop, viewport.clientHeight) - 1);
      const cPx = Math.min(pointerX, maxPx);
      const cPy = Math.min(pointerY, maxPy);

      const contentX = (viewport.scrollLeft + cPx) / currentZoom;
      const contentY = (viewport.scrollTop + cPy) / currentZoom;

      setMapZoom(nextZoom);
      zoomScrollRef.current = {
        left: Math.max(0, contentX * nextZoom - cPx),
        top: Math.max(0, contentY * nextZoom - cPy),
      };
      updateMinimapViewport();
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [mapZoom, updateMinimapViewport]);

  useLayoutEffect(() => {
    const vs = zoomScrollRef.current;
    if (!vs) return;
    zoomScrollRef.current = null;
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = vs.left;
    viewport.scrollTop = vs.top;
  }, [mapZoom]);

  // Math for positioning items accurately over the grid
  const boardBaseMeasure = maxBoardPixels ? `${maxBoardPixels}px` : "calc(20rem + 14vw)";
  const tileMargin = "0.1rem";
  const cellSize = `calc((${boardBaseMeasure} / ${size}) * ${mapZoom})`;
  const tileBaseSize = `calc(${cellSize} - (${tileMargin} * 2))`;
  const baseCellSize = `calc(${boardBaseMeasure} / ${size})`;
  const paddingLeft = "0rem";
  const baseBoardWidth = `calc(${size} * ${cellSize})`;
  const baseBoardHeight = `calc(${size} * ${cellSize})`;
  const viewportWidth = `calc(${size} * ${baseCellSize})`;
  const viewportHeight = `calc(${size} * ${baseCellSize})`;
  const boardContainerStyle = {
    "--tile-size": tileBaseSize,
  } as React.CSSProperties;
  const boardViewportStyle = {
    width: viewportWidth,
    height: viewportHeight,
    ...(mapZoom > 1 ? { overflow: 'auto' } : {}),
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

  const getCellMetrics = useCallback(() => {
    const wrapper = boardWrapperRef.current;
    if (!wrapper) return null;

    const rect = wrapper.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      width: rect.width / size,
      height: rect.height / size,
      rect,
    };
  }, [size]);

  const ensurePreviewCells = useCallback((count: number) => {
    const container = previewOverlayRef.current;
    if (!container) return [];

    while (previewCellRefs.current.length < count) {
      const cell = document.createElement('div');
      cell.style.position = 'absolute';
      cell.style.pointerEvents = 'none';
      cell.style.borderRadius = '3px';
      cell.style.boxSizing = 'border-box';
      cell.style.willChange = 'transform';
      cell.style.display = 'none';
      container.appendChild(cell);
      previewCellRefs.current.push(cell);
    }

    return previewCellRefs.current;
  }, []);

  const updateHoverPreview = useCallback((x: number, y: number) => {
    const metrics = getCellMetrics();
    if (!metrics) return;

    lastHoverCoordsRef.current = [x, y];
    setHoverTile({ x, y });

    const hover = hoverOverlayRef.current;
    if (hover) {
      hover.style.display = activeRef.current ? 'block' : 'none';
      hover.style.width = `${metrics.width}px`;
      hover.style.height = `${metrics.height}px`;
      hover.style.transform = `translate3d(${y * metrics.width}px, ${x * metrics.height}px, 0)`;
    }

    const currentMarked = markedRef.current;
    if (!currentMarked || !isLocalBoard || game.getInit) {
      previewCellRefs.current.forEach((cell) => {
        cell.style.display = 'none';
      });
      return;
    }

    const previewLen = currentMarked.getLength === 5 && currentMarked.getDirection % 90 !== 0 ? 4 : currentMarked.getLength;
    const offsets = Array.from({ length: previewLen }, (_, k) => {
      if (currentMarked.getDirection === 0) return [0, k];
      if (currentMarked.getDirection === 45) return [k, k];
      if (currentMarked.getDirection === 90) return [k, 0];
      if (currentMarked.getDirection === 135) return [k, -k];
      if (currentMarked.getDirection === 180) return [0, -k];
      if (currentMarked.getDirection === 225) return [-k, -k];
      if (currentMarked.getDirection === 270) return [-k, 0];
      if (currentMarked.getDirection === 315) return [-k, k];
      return [0, k];
    });
    const cells = offsets.map(([ox, oy]) => [x - ox, y - oy] as [number, number]);
    const isValid = cells.every(([r, c]) => validTileSetRef.current.has(`${r},${c}`));
    const color = isValid ? 'rgba(46, 204, 113, 0.65)' : 'rgba(231, 76, 60, 0.65)';
    const previewCells = ensurePreviewCells(cells.length);

    previewCells.forEach((cell, index) => {
      if (index >= cells.length) {
        cell.style.display = 'none';
        return;
      }

      const [r, c] = cells[index];
      cell.style.display = 'block';
      cell.style.width = `${metrics.width}px`;
      cell.style.height = `${metrics.height}px`;
      cell.style.backgroundColor = color;
      cell.style.transform = `translate3d(${c * metrics.width}px, ${r * metrics.height}px, 0)`;
    });
  }, [ensurePreviewCells, game, getCellMetrics, player, playerIndex]);

  useEffect(() => {
    const lastHover = lastHoverCoordsRef.current;
    if (marked && lastHover) {
      updateHoverPreview(lastHover[0], lastHover[1]);
    } else if (!marked) {
      clearHoverPreview();
    }
  }, [marked, rotationToggle, mapZoom, updateHoverPreview]);

  const getTileLocationFromTarget = useCallback((target: EventTarget | null): [number, number] | null => {
    if (!(target instanceof HTMLElement)) return null;
    const tile = target.closest<HTMLElement>('.board-tile');
    if (!tile || !boardWrapperRef.current?.contains(tile)) return null;

    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
    return [row, col];
  }, []);

  const getTileLocationFromPointer = useCallback((event: PointerEvent): [number, number] | null => {
    const metrics = getCellMetrics();
    if (!metrics) return null;

    const col = Math.floor((event.clientX - metrics.rect.left) / metrics.width);
    const row = Math.floor((event.clientY - metrics.rect.top) / metrics.height);
    if (row < 0 || row >= size || col < 0 || col >= size) return null;

    return [row, col];
  }, [getCellMetrics, size]);

  useEffect(() => {
    const wrapper = boardWrapperRef.current;
    if (!wrapper) return;

    const flushPointer = () => {
      pointerFrameRef.current = null;
      const event = pendingPointerEventRef.current;
      pendingPointerEventRef.current = null;
      if (!event) return;
      if (!activeRef.current && !markedRef.current) return;

      const loc = getTileLocationFromPointer(event);
      if (!loc) {
        clearHoverPreview();
        return;
      }

      const lastHover = lastHoverCoordsRef.current;
      if (lastHover && lastHover[0] === loc[0] && lastHover[1] === loc[1]) return;

      updateHoverPreview(loc[0], loc[1]);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pendingPointerEventRef.current = event;
      if (pointerFrameRef.current === null) {
        pointerFrameRef.current = window.requestAnimationFrame(flushPointer);
      }
    };

    wrapper.addEventListener('pointermove', handlePointerMove, { passive: true });
    wrapper.addEventListener('pointerleave', clearHoverPreview);

    return () => {
      wrapper.removeEventListener('pointermove', handlePointerMove);
      wrapper.removeEventListener('pointerleave', clearHoverPreview);
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    };
  }, [clearHoverPreview, getTileLocationFromPointer, updateHoverPreview]);

  const handleBoardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const loc = getTileLocationFromTarget(event.target);
    if (!loc) return;
    chooseAction(loc[0], loc[1]);
  }, [chooseAction, getTileLocationFromTarget]);

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
              data-row={i}
              data-col={j}
              className={classes}
            />
          );
        })}
      </div>
    ))
  ), [board, heightMap, stateSets]);
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
          left: `calc((${col} * ${cellSize}) + ((${cellSize}) / 2) - ${viewportScroll.left}px)`,
          transform: `translateX(-50%)`,
        }}
      >
        {getColumnLabel(col)}
      </div>
    ))
  ), [mapZoom, cellSize, size, viewportScroll.left]);

  const yAxisLayerStyle = {
    transformOrigin: 'top left',
  } as React.CSSProperties;

  const xAxisLayerStyle = {
    transformOrigin: 'top left',
  } as React.CSSProperties;

  return (
   
     <BoardContainer $size={size} $zoom={mapZoom} $axisRight={player === 1} style={boardContainerStyle}>
      <div className="board-viewport-shell" >
        <div className="board-zoom-control" >
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={mapZoom}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              const viewport = viewportRef.current;
              const oldZoom = mapZoom;
              setMapZoom(v);
              if (viewport) {
                const cx = viewport.scrollLeft + viewport.clientWidth / 2;
                const cy = viewport.scrollTop + viewport.clientHeight / 2;
                zoomScrollRef.current = {
                  left: Math.max(0, (cx / oldZoom) * v - viewport.clientWidth / 2),
                  top: Math.max(0, (cy / oldZoom) * v - viewport.clientHeight / 2),
                };
              }
              updateMinimapViewport();
            }}
          />
          <span>{Math.round(mapZoom * 100)}%</span>
        </div>
       
      <div className="board-axis-y-viewport" style={{ height: viewportHeight, maxHeight: viewportHeight, overflow: 'hidden', contain: 'paint' }}>
              <div className="board-axis-y-layer" style={{...yAxisLayerStyle, overflow: 'hidden', width: '100%', height: '100%', contain: 'paint'}}>
                {yAxisLabels}
              </div>
            </div>
            <div className="board-axis-x-viewport" style={{ width: viewportWidth, maxWidth: viewportWidth, overflow: 'hidden', contain: 'paint' }}>
              <div className="board-axis-x-layer" style={{...xAxisLayerStyle, overflow: 'hidden', width: '100%', height: '100%', contain: 'paint'}}>
                {xAxisLabels}
              </div>
            </div>


        
        <div
          ref={viewportRef}
          className={`board-viewport ${mapZoom > 1 ? 'zoomed' : ''} ${active}`}
          onScroll={updateMinimapViewport}
          style={boardViewportStyle}
        >
          <div className="board-zoom-space" style={boardZoomSpaceStyle}>
       <div
         ref={boardWrapperRef}
         className={`board-wrapper ${active}`}
         onClick={handleBoardClick}
         style={boardWrapperStyle}
       >
         
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
            if (!isLocalBoard && !ship.isSunk()) return null;
           
           const [x, y] = ship.getOrigin;
           const dir = ship.getDirection;
           
            let visualX = x;
            let visualY = y;
            const placeLen = ship.placedLength;
            
            if (dir === 0) {
               visualY -= (placeLen - 1);
            } else if (dir === 45) {
               visualX -= (placeLen - 1);
               visualY -= (placeLen - 1);
            } else if (dir === 90) {
               visualX -= (placeLen - 1);
            } else if (dir === 135) {
               visualX -= (placeLen - 1);
               visualY += (placeLen - 1);
            } else if (dir === 180) {
               visualY += (placeLen - 1);
            } else if (dir === 225) {
               visualX += (placeLen - 1);
               visualY += (placeLen - 1);
            } else if (dir === 270) {
               visualX += (placeLen - 1);
            } else if (dir === 315) {
               visualX += (placeLen - 1);
               visualY -= (placeLen - 1);
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

          <div
            ref={hoverOverlayRef}
            style={{
              display: 'none',
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 10,
              border: '2px solid white',
              borderRadius: '3px',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              willChange: 'transform',
            }}
          />
          <div
            ref={previewOverlayRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 11,
              pointerEvents: 'none',
            }}
          />

          {/* Floating ship visual on hover tile */}
          {marked && isLocalBoard && !game.getInit && hoverTile && (() => {
            const dir = marked.getDirection;
            const placeLen = marked.getLength === 5 && dir % 90 !== 0 ? 4 : marked.getLength;
            let vx = hoverTile.x;
            let vy = hoverTile.y;
            if (dir === 0) vy -= (placeLen - 1);
            else if (dir === 45) { vx -= (placeLen - 1); vy -= (placeLen - 1); }
            else if (dir === 90) vx -= (placeLen - 1);
            else if (dir === 135) { vx -= (placeLen - 1); vy += (placeLen - 1); }
            else if (dir === 180) vy += (placeLen - 1);
            else if (dir === 225) { vx += (placeLen - 1); vy += (placeLen - 1); }
            else if (dir === 270) vx += (placeLen - 1);
            else if (dir === 315) { vx += (placeLen - 1); vy -= (placeLen - 1); }
            return (
              <div style={{
                position: 'absolute',
                left: `calc(${paddingLeft} + (${vy} * ${cellSize}) + ${tileMargin})`,
                top: `calc((${vx} * ${cellSize}) + ${tileMargin})`,
                zIndex: 12,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 0 3px rgba(46,204,113,0.9))',
              }}>
                <ShipVisual
                  length={marked.getLength}
                  direction={dir}
                  isSunk={false}
                  index={marked.shipType === "submarine" ? 1 : 0}
                  boardSize={size}
                  zoom={mapZoom}
                />
              </div>
            );
          })()}

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
            {isLocalBoard && boardShips.map((ship, i) => {
              const [r, c] = ship.getOrigin;
              const len = ship.placedLength;
              const dir = ship.getDirection;
              const isSunk = ship.isSunk();
              const pct = (v: number) => `${(v / size) * 100}%`;
              let left: number, top: number, w: number, h: number;
              if (dir === 0) { left = c - len + 1; top = r; w = len; h = 1; }
              else if (dir === 45) { left = c - len + 1; top = r - len + 1; w = len; h = len; }
              else if (dir === 90) { left = c; top = r - len + 1; w = 1; h = len; }
              else if (dir === 135) { left = c; top = r - len + 1; w = len; h = len; }
              else if (dir === 180) { left = c; top = r; w = len; h = 1; }
              else if (dir === 225) { left = c; top = r; w = len; h = len; }
              else if (dir === 270) { left = c; top = r; w = 1; h = len; }
              else if (dir === 315) { left = c - len + 1; top = r; w = len; h = len; }
              else { left = c; top = r; w = 1; h = len; }
              return (
                <div key={`minimap-ship-${i}`} style={{
                  position: 'absolute',
                  left: pct(left < 0 ? 0 : left),
                  top: pct(top < 0 ? 0 : top),
                  width: pct(w),
                  height: pct(h),
                  backgroundColor: isSunk ? 'rgba(180,180,180,0.7)' : 'rgba(60,60,60,0.8)',
                  borderRadius: '2px',
                  border: isSunk ? '1px solid #888' : '1px solid #ccc',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  zIndex: 2,
                }} />
              );
            })}
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
    </BoardContainer>
  
  );
}

const areBoardPropsEqual = (prev: BoardProps, next: BoardProps) => (
  prev.player === next.player &&
  prev.game === next.game &&
  prev.state === next.state &&
  prev.loop === next.loop &&
  prev.turn === next.turn &&
  prev.init === next.init &&
  prev.reset === next.reset &&
  prev.gameMode === next.gameMode &&
  prev.playerIndex === next.playerIndex &&
  prev.updateBoardState === next.updateBoardState &&
  prev.playerName === next.playerName &&
  prev.localAvatar === next.localAvatar &&
  prev.seed === next.seed &&
  prev.maxBoardPixels === next.maxBoardPixels
);

export default React.memo(Board, areBoardPropsEqual);
