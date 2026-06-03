import React, { useState, useEffect, useRef } from "react";
import Board from "./Board";
import WeaponPanel from "./WeaponPanel";
import ShipVisual from "./ShipVisual";
import Game from "../scripts/Game";
import Battleship from "../scripts/Battleship";
import { BoardsContainer, BoardContainer, TimerDisplay, ExplosionOverlay, FooterContainer, FooterSection, FooterLabel, FooterRow, ShipsRow, ShipTile, FooterDivider } from "./styled_components/BoardsStyles";
import { Socket } from "socket.io-client";
import PlayerProfile from "./PlayerProfile";

type BoardsProps = {
  game: Game;
  updateTurn: () => void;
  turn: 0 | 1;
  init: boolean;
  reset: boolean;
  gameMode: 'singleplayer' | 'lobby' | 'multiplayer' | null;
  socket: Socket | null;
  roomId: string;
  playerIndex: number | null;
  isLocalReady?: boolean;
  isOpponentReady?: boolean;
  hasOpponent?: boolean;
  opponentName?: string;
  opponentAvatar?: string;
  playerName?: string;
  localAvatar?: string;
  mySeed?: number;
  opponentSeed?: number;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

const Boards = ({ 
  game, 
  updateTurn, 
  turn, 
  init, 
  reset, 
  gameMode, 
  socket, 
  roomId, 
  playerIndex, 
  isLocalReady = false, 
  isOpponentReady = false, 
  hasOpponent = false, 
  opponentName = '', 
  opponentAvatar = '',
  playerName = '',
  localAvatar = '',
  mySeed = 20,
  opponentSeed = 20,
  autoPlay = false,
  autoPlayDelay = 400,
}: BoardsProps) => {
  const [timer, setTimer] = useState<number>(30);
  const [showExplosion, setShowExplosion] = useState<boolean>(false);
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statePlayer, setStatePlayer] = useState<{[state: string]: [number, number][]}>(
    game.getPlayer(0).getBoard.getBoardStates
  );
  const [stateComputer, setStateComputer] = useState<{[state: string]: [number, number][]}>(
    game.getPlayer(1).getBoard.getBoardStates
  );
  const [shipsPlayer, setShipsPlayer] = useState<Battleship[]>(
    game.getPlayer(0).getBoard.getShips
  );
  const [shipsComputer, setShipsComputer] = useState<Battleship[]>(
    game.getPlayer(1).getBoard.getShips
  );
  const [selectedShipIndex, setSelectedShipIndex] = useState<number | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);

  const updateStatePlayer = () => {
    setStatePlayer(game.getPlayer(0).getBoard.getBoardStates);
    setShipsPlayer([...game.getPlayer(0).getBoard.getShips]);
  }

  const updateStateComputer = () => {
    setStateComputer(game.getPlayer(1).getBoard.getBoardStates);
    setShipsComputer([...game.getPlayer(1).getBoard.getShips]);
  }

  const updateShipsPlayer = () => {
    setShipsPlayer([...game.getPlayer(0).getBoard.getShips]);
  }

  const loop = async (loc: [number, number]) => {
    function timeout(min: number, max: number) {
      return new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
      );
    }

    const scheduleAutoPlay = () => {
      if (autoPlayRef.current && game.getWinner === -1) {
        const loc = game.getPlayer(0).chooseAttack(game.getPlayer(1).getBoard) as [number, number] | undefined;
        if (!loc) return;
        if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
        autoTimerRef.current = setTimeout(async () => {
          if (!autoPlayRef.current || game.getWinner !== -1) return;
          await loop(loc);
        }, autoPlayDelay);
      }
    };

    if (game.getWinner === -1) {
      // In multiplayer, you can only attack on your turn (which is turn 0 locally)
      if (gameMode === 'multiplayer' && game.getTurn !== 0) return;

      const opponentBoard = game.getPlayer(1).getBoard;
      const longestShipBefore = opponentBoard.getShips.find(s => s.getLength === 5);
      const wasSunkBefore = longestShipBefore ? longestShipBefore.isSunk() : false;

      const success = game.playerTurn([loc[0], loc[1]]);
      if (success) {
        const isSunkAfter = longestShipBefore ? longestShipBefore.isSunk() : false;

        // Trigger explosion animation if local player just sunk the longest ship
        if (!wasSunkBefore && isSunkAfter) {
           setShowExplosion(true);
           setTimeout(() => setShowExplosion(false), 3000); // Hide after 3 seconds
        }

        game.setWinner = game.isWinner();
        updateStateComputer();
        updateTurn();
        game.next();
        setTimer(30);

        if (gameMode === 'multiplayer') {
          socket?.emit('attack', { roomId, loc });
          updateTurn();
        } else if (gameMode === 'singleplayer' && game.getWinner === -1) {
          updateTurn();
          await timeout(500, 2000);
          game.computerTurn();
          game.setWinner = game.isWinner();
          updateTurn();
          game.next();
          updateTurn();
          updateStatePlayer();
          setTimer(30);
          scheduleAutoPlay();
        }
      }
    }
  }

  useEffect(() => {
    let interval: any;
    if (init && game.getWinner === -1) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            if (game.getTurn === 0) {
              const opponentBoard = game.getPlayer(1).getBoard;
              const validAttacks = [...opponentBoard.getBoardStates.shipNotHit, ...opponentBoard.getBoardStates.notShot];
              if (validAttacks.length > 0) {
                const randomLoc = validAttacks[Math.floor(Math.random() * validAttacks.length)];
                loop(randomLoc);
              }
            }
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [init, game, turn]);

  useEffect(() => {
    if (gameMode === 'multiplayer' && socket) {
      const handleOpponentAttack = (loc: [number, number]) => {
        game.playerTurn(loc);
        game.setWinner = game.isWinner();
        updateStatePlayer();
        updateShipsPlayer();
        game.next();
        updateTurn();
        setTimer(30);

        if (autoPlayRef.current && game.getWinner === -1 && game.getTurn === 0) {
          const loc = game.getPlayer(0).chooseAttack(game.getPlayer(1).getBoard) as [number, number] | undefined;
          if (loc) {
            if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
            autoTimerRef.current = setTimeout(() => {
              if (!autoPlayRef.current || game.getWinner !== -1) return;
              loop(loc);
            }, autoPlayDelay);
          }
        }
      };

      socket.on('attack', handleOpponentAttack);
      return () => {
        socket.off('attack', handleOpponentAttack);
      };
    }
  }, [gameMode, socket, game, playerIndex, updateTurn]);

  useEffect(() => {
    if(reset) {
      setStatePlayer(game.getPlayer(0).getBoard.getBoardStates);
      setStateComputer(game.getPlayer(1).getBoard.getBoardStates);
      setShipsPlayer(game.getPlayer(0).getBoard.getShips);
      setShipsComputer(game.getPlayer(1).getBoard.getShips);
      setTimer(30);
      setShowExplosion(false);
    }
  }, [reset, game]);

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (autoPlay && init && game.getWinner === -1 && game.getTurn === 0) {
      const loc = game.getPlayer(0).chooseAttack(game.getPlayer(1).getBoard) as [number, number] | undefined;
      if (loc) loop(loc);
    }
  }, [autoPlay]);

  const handleShipClick = (index: number) => {
    if (selectedShipIndex === index) {
      setSelectedShipIndex(null);
      setSelectedWeapon(null);
    } else {
      setSelectedShipIndex(index);
    }
  };

  const handleSelectWeapon = (weaponId: string) => {
    setSelectedWeapon(weaponId);
  };

  const handleCloseWeaponPanel = () => {
    setSelectedShipIndex(null);
    setSelectedWeapon(null);
  };

  const selectedShip = selectedShipIndex !== null ? shipsPlayer[selectedShipIndex] : null;

  return (
    <>
      {showExplosion && (
        <ExplosionOverlay>
          <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDl2cG91dGMwZzcyOG54bGRueGI0OW5sY2F5a3VwcDB3aHRuaHNldSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XDRoTw2Fs6rlIW7yQL/giphy.gif" alt="Explosion" />
        </ExplosionOverlay>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <BoardsContainer>
          {init && game.getWinner === -1 && (
            <TimerDisplay $isLow={timer <= 10}>
              {timer}s left
            </TimerDisplay>
          )}
          <BoardContainer>
            <Board
              player={0}
              game={game}
              state={statePlayer}
              loop={loop}
              turn={turn}
              init={init}
              reset={reset}
              gameMode={gameMode}
              playerIndex={playerIndex}
              updateBoardState={updateStatePlayer}
              seed={mySeed}
            />
          </BoardContainer>
          <BoardContainer>
            <Board
              player={1}
              game={game}
              state={stateComputer}
              loop={loop}
              turn={turn}
              init={init}
              reset={reset}
              seed={opponentSeed}
            />
          </BoardContainer>
        </BoardsContainer>

        <FooterContainer>
          <FooterSection>
            <FooterLabel>Your Ships</FooterLabel>
            <FooterRow>
              <ShipsRow>
                {[...shipsPlayer].sort((a, b) => a.getLength - b.getLength).map((ship, i) => {
                  const zoom = 0.27;
                  return (
                    <ShipTile
                      key={i}
                      $selected={selectedShipIndex === i}
                      $sunk={ship.isSunk()}
                      onClick={() => handleShipClick(i)}
                      title={`${ship.shipType} (${ship.getLength})`}
                    >
                      <div style={{
                        position: 'relative',
                        height: `calc(((14rem + 10vw) / 10) * ${zoom})`,
                        width: `calc((${ship.getLength} * ((14rem + 10vw) / 10) + (${ship.getLength - 1} * 0.2rem)) * ${zoom})`,
                        overflow: 'hidden',
                      }}>
                        <ShipVisual
                          length={ship.getLength}
                          direction={0}
                          isSunk={ship.isSunk()}
                          index={ship.shipType === "submarine" ? 1 : 0}
                          boardSize={10}
                          zoom={zoom}
                        />
                      </div>
                    </ShipTile>
                  );
                })}
              </ShipsRow>
              <PlayerProfile name={playerName} avatarUrl={localAvatar} isReady={isLocalReady} align="right" showStatus={!init} />
            </FooterRow>
            {selectedShip && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 50 }}>
                <WeaponPanel
                  ship={selectedShip}
                  onSelectWeapon={handleSelectWeapon}
                  selectedWeapon={selectedWeapon}
                  onClose={handleCloseWeaponPanel}
                />
              </div>
            )}
          </FooterSection>

          <FooterDivider />

          <FooterSection>
            <FooterLabel>Opponent Ships</FooterLabel>
            <FooterRow>
              <PlayerProfile 
                name={gameMode === 'multiplayer' ? (hasOpponent ? opponentName : '') : 'Computer'} 
                avatarUrl={gameMode === 'multiplayer' && hasOpponent ? opponentAvatar : undefined}
                isReady={isOpponentReady} 
                align="left" 
                showStatus={!init && gameMode === 'multiplayer'} 
                isSkeleton={gameMode === 'multiplayer' && !hasOpponent} 
              />
              <ShipsRow>
                {[...shipsComputer].sort((a, b) => a.getLength - b.getLength).map((ship, i) => {
                  const zoom = 0.27;
                  return (
                    <ShipTile
                      key={i}
                      $selected={false}
                      $sunk={ship.isSunk()}
                      title={`${ship.shipType} (${ship.getLength})`}
                      style={{ cursor: 'default' }}
                    >
                      <div style={{
                        position: 'relative',
                        height: `calc(((14rem + 10vw) / 10) * ${zoom})`,
                        width: `calc((${ship.getLength} * ((14rem + 10vw) / 10) + (${ship.getLength - 1} * 0.2rem)) * ${zoom})`,
                        overflow: 'hidden',
                      }}>
                        <ShipVisual
                          length={ship.getLength}
                          direction={0}
                          isSunk={ship.isSunk()}
                          index={ship.shipType === "submarine" ? 1 : 0}
                          boardSize={10}
                          zoom={zoom}
                        />
                      </div>
                    </ShipTile>
                  );
                })}
              </ShipsRow>
            </FooterRow>
          </FooterSection>
        </FooterContainer>
      </div>
    </>
  );
}

export default Boards;
