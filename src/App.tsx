import React, { useState, useEffect, useRef } from 'react';
import Boards from "./components/Boards";
import Confetti from "./components/Confetti";
import Game from "./scripts/Game";
import { generateUnifiedMap } from "./scripts/Noise";
import { Display, DisplayWrapper, Buttons, HeaderWrapper, Title } from "./components/styled_components/AppStyles";
import { FaWater, FaDiceD6, FaRecycle, FaPlay, FaUndo, FaSignOutAlt, FaRobot } from "react-icons/fa";
import RetroBtn from "./components/RetroBtn";
import { io, Socket } from "socket.io-client";

const App = () => {
  const ships: number[] = [5, 4, 3, 3, 2];
  const [boardSize, setBoardSize] = useState<number>(10);
  const [game, setGame] = useState<Game>(new Game(ships, 10));
  const [display, setDisplay] = useState<string>('Move/Rotate ships');
  const [turn, setTurn] = useState<0 | 1>(game.getTurn);
  const [init, setInit] = useState<boolean>(game.getInit);
  const [reset, setReset] = useState<boolean>(false);

  // Multiplayer State
  const [gameMode, setGameMode] = useState<'singleplayer' | 'lobby' | 'multiplayer' | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('battleship_playerName') || `Guest${Math.floor(Math.random() * 10000)}`;
  });
  const [localAvatar, setLocalAvatar] = useState<string>(() => {
    return localStorage.getItem('battleship_localAvatar') || '';
  });

  // Initialize random avatar if not persisted
  useEffect(() => {
    if (!localAvatar) {
      const avatarFiles = ['avatar1.jpg', 'avatar2.webp', 'avatar3.jpg', 'avatar4.jpg', 'avatar5.jpg'];
      const randomAvatar = `/avatars/${avatarFiles[Math.floor(Math.random() * avatarFiles.length)]}`;
      setLocalAvatar(randomAvatar);
      game.getPlayer(0).setAvatar(randomAvatar);
    } else {
      game.getPlayer(0).setAvatar(localAvatar);
    }
    const newGame = Object.assign(Object.create(Object.getPrototypeOf(game)), game);
    setGame(newGame);
  }, []); // Run once on mount

  // Persist profile changes
  useEffect(() => {
    localStorage.setItem('battleship_playerName', playerName);
  }, [playerName]);

  useEffect(() => {
    if (localAvatar) {
      localStorage.setItem('battleship_localAvatar', localAvatar);
    }
  }, [localAvatar]);

  const [lobbyRooms, setLobbyRooms] = useState<{roomId: string, hostName: string, boardSize: number}[]>([]);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [multiplayerStatus, setMultiplayerStatus] = useState<string>('');
  const [isOpponentReady, setIsOpponentReady] = useState<boolean>(false);
  const [isLocalReady, setIsLocalReady] = useState<boolean>(false);
  const [hasOpponent, setHasOpponent] = useState<boolean>(false);
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentAvatar, setOpponentAvatar] = useState<string>('');
  const [mySeed, setMySeed] = useState<number>(0);
  const [opponentSeed, setOpponentSeed] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [autoPlayDelay, setAutoPlayDelay] = useState<number>(400);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (gameMode === 'lobby' || gameMode === 'multiplayer') {
      if (!socketRef.current) {
        // Dynamically connect to the backend based on the current hostname
        const backendUrl = `http://${window.location.hostname}:3001`;
        socketRef.current = io(backendUrl);
      }
      const socket = socketRef.current;

      if (socket.connected) {
        socket.emit('request_room_list');
      }

      socket.on('connect', () => {
        socket.emit('request_room_list');
      });

      socket.on('room_list', (rooms) => {
        setLobbyRooms(rooms);
      });

      socket.on('player_assigned', ({ index, boardSize, mySeed, opponentSeed }) => {
        setPlayerIndex(index);
        setBoardSize(boardSize);
        setMySeed(mySeed);
        setOpponentSeed(opponentSeed);
        setGameMode('multiplayer');
        setMultiplayerStatus('Joined room. Waiting for opponent...');

        // Re-initialize game with correct board size and unified heightmap
        const unifiedSeed = (mySeed + opponentSeed) % 1000000;
        const mapData = generateUnifiedMap(boardSize, unifiedSeed);
        
        const newGame = new Game(
          ships, 
          boardSize, 
          [mapData.leftHeightMap, mapData.rightHeightMap],
          [mapData.leftTextureUrl, mapData.rightTextureUrl]
        );
        newGame.getPlayer(index as 0 | 1).setName(playerName);
        newGame.getPlayer(index as 0 | 1).setAvatar(localAvatar);

        if (index === 1) {
            setHasOpponent(true); // If we are player 1, the host (player 0) is already here
        }
        setTurn(0);
        setGame(newGame);
        setReset(true);
        setTimeout(() => setReset(false), 0);
      });

      socket.on('all_players_connected', ({ opponentName, opponentAvatar }) => {
        setHasOpponent(true);
        const localIdx = (playerIndex ?? 0) as 0 | 1;
        if (opponentName) {
          setOpponentName(opponentName);
          game.getPlayer((1 - localIdx) as 0 | 1).setName(opponentName);
        }
        if (opponentAvatar) {
          setOpponentAvatar(opponentAvatar);
          game.getPlayer((1 - localIdx) as 0 | 1).setAvatar(opponentAvatar);
        }
        setMultiplayerStatus('Opponent connected. Place your ships!');
        // Force a re-render
        setGame(prev => Object.assign(Object.create(Object.getPrototypeOf(prev)), prev));
      });

      socket.on('opponent_ready', () => {
        setIsOpponentReady(true);
        setMultiplayerStatus('Opponent is Ready!');
      });

      socket.on('opponent_unready', () => {
        setIsOpponentReady(false);
        setMultiplayerStatus(prev => prev === 'Opponent is Ready!' ? 'Connected. Place your ships!' : prev);
      });

      socket.on('game_start', ({ opponentShips, opponentName, opponentAvatar }) => {
        const localIdx = (playerIndex ?? 0) as 0 | 1;
        game.setOpponentShips(opponentShips, localIdx);
        if (opponentName) {
          setOpponentName(opponentName);
          game.getPlayer((1 - localIdx) as 0 | 1).setName(opponentName);
        }
        if (opponentAvatar) {
          setOpponentAvatar(opponentAvatar);
          game.getPlayer((1 - localIdx) as 0 | 1).setAvatar(opponentAvatar);
        }
        game.init(localIdx);
        updateInit();
        updateDisplay();
        setMultiplayerStatus('Game Started!');
      });

      socket.on('opponent_renewed_islands', ({ playerIndex, newSeed }) => {
        const mapData = generateUnifiedMap(boardSize, newSeed);
        game.getPlayer(0).getBoard.setHeightMap(mapData.leftHeightMap, mapData.leftTextureUrl);
        game.getPlayer(1).getBoard.setHeightMap(mapData.rightHeightMap, mapData.rightTextureUrl);
        setMySeed(newSeed);
        setOpponentSeed(newSeed);
        setGame(Object.assign(Object.create(Object.getPrototypeOf(game)), game));
        setReset(true);
        setTimeout(() => setReset(false), 0);
      });

      socket.on('opponent_disconnected', () => {
        alert('Opponent disconnected');
        window.location.reload();
      });

      socket.on('error', (msg) => {
        alert(msg);
        socket.disconnect();
      });

      return () => {
        socket.off('room_list');
        socket.off('player_assigned');
        socket.off('all_players_connected');
        socket.off('opponent_ready');
        socket.off('game_start');
        socket.off('opponent_renewed_islands');
        socket.off('opponent_disconnected');
        socket.off('error');
      };
    }
  }, [gameMode, game, playerName, localAvatar, playerIndex]);

  const updateDisplay = () => {
    if (!game.getInit) {
      setDisplay('Move/Rotate ships');
    } else if (game.getWinner !== -1) {
      const localIdx = (playerIndex ?? 0) as 0 | 1;
      const winnerName = gameMode === 'multiplayer' 
        ? (game.getWinner === localIdx ? "You" : (opponentName || "Opponent"))
        : game.getPlayer(game.getWinner).getName;
      setDisplay(`${winnerName} won!`);
    } else if (game.getInit) {
      const localIdx = (playerIndex ?? 0) as 0 | 1;
      if (game.getTurn === localIdx) {
        setDisplay('Your turn');
      } else {
        const nameToShow = gameMode === 'multiplayer' ? opponentName : game.getPlayer((1 - localIdx) as 0 | 1).getName;
        setDisplay(`${nameToShow}'s turn`);
      }
    }
  }

  const updateTurn = () => {
    setTurn(game.getTurn);
    updateDisplay();
  }

  const updateInit = () => {
    setInit(game.getInit);
  }

  const initGame = () => {
    if (gameMode === 'multiplayer') {
      const localPlayerIndex = (playerIndex ?? 0) as 0 | 1;
      const shipsData = game.getPlayer(localPlayerIndex).getBoard.getShips.map(s => ({
        length: s.getLength,
        origin: s.getOrigin,
        direction: s.getDirection,
        shipType: s.shipType,
        placedLength: s.placedLength,
      }));
      socketRef.current?.emit('ships_ready', { roomId, ships: shipsData });
      setMultiplayerStatus('Waiting for opponent to be ready...');
    } else {
      game.init();
      updateDisplay();
      updateInit();
      setReset(false);
    }
  }

  const regenerateIslands = () => {
    const seed = Math.floor(Math.random() * 1000000);
    const mapData = generateUnifiedMap(boardSize, seed);

    if (gameMode === 'multiplayer' && socketRef.current && roomId) {
      socketRef.current.emit('renew_islands', { 
        roomId, 
        newSeed: seed,
        playerName,
        avatar: localAvatar
      });
    }

    const newGame = new Game(ships, boardSize, [mapData.leftHeightMap, mapData.rightHeightMap], [mapData.leftTextureUrl, mapData.rightTextureUrl]);
    newGame.getPlayer(0).setName(game.getPlayer(0).getName);
    newGame.getPlayer(0).setAvatar(game.getPlayer(0).getAvatar);
    newGame.getPlayer(1).setName(game.getPlayer(1).getName);
    newGame.getPlayer(1).setAvatar(game.getPlayer(1).getAvatar);
    setMySeed(seed);
    setOpponentSeed(seed);
    setGame(newGame);
    setReset(true);
    setTimeout(() => setReset(false), 0);
    setDisplay('Move/Rotate ships');
    setInit(false);
  };

  const randomizeShips = () => {
    const board = game.getPlayer((playerIndex ?? 0) as 0 | 1).getBoard;
    board.clearShips();
    board.distributeShips(game.getShips);
    // Force a re-render by replacing the game instance
    const newGame = Object.assign(Object.create(Object.getPrototypeOf(game)), game);
    setGame(newGame);
    // Setting reset to false then true triggers the Board component to re-read states
    setReset(false);
    setTimeout(() => setReset(true), 0);
  }

  const leaveRoom = () => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('leave_room', roomId);
    }
    window.location.reload();
  }

  const restartGame = async () => {
    const unifiedSeed = (mySeed + opponentSeed) % 1000000;
    const mapData = generateUnifiedMap(boardSize, unifiedSeed);
    
    const newGame = new Game(
        ships, 
        boardSize, 
        [mapData.leftHeightMap, mapData.rightHeightMap],
        [mapData.leftTextureUrl, mapData.rightTextureUrl]
    );
    // Preserve names
    newGame.getPlayer(0).setName(game.getPlayer(0).getName);
    newGame.getPlayer(1).setName(game.getPlayer(1).getName);

    setGame(newGame);
    setReset(true);
    setTimeout(() => setReset(false), 0);
    setTurn(0);
    setDisplay("Move/Rotate ships");
    setInit(false);

    if (gameMode === 'multiplayer') {
        setIsLocalReady(false);
        setMultiplayerStatus('Connected. Re-place ships and click Ready.');
        socketRef.current?.emit('restart_game', roomId, (opponentReady: boolean) => {
            setIsOpponentReady(opponentReady);
            if (opponentReady) {
                setMultiplayerStatus('Opponent is Ready!');
            }
        });
    }
  }

  const handleJoinRoom = (idToJoin: string, selectedSize: number = boardSize) => {
    setRoomId(idToJoin);
    if (socketRef.current) {
      game.getPlayer(0).setName(playerName);
      socketRef.current.emit('join_room', { roomId: idToJoin, playerName, avatar: localAvatar, boardSize: selectedSize });
    }
  }

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    handleJoinRoom(newRoomId, boardSize);
  }

  const getMultiplayerButton = () => {
    if (isLocalReady) {
      return <RetroBtn label="Waiting..." title="Waiting for opponent..." disabled color="secondary" size="sm"><FaRecycle /></RetroBtn>;
    }
    const buttonLabel = isOpponentReady ? "Start Game" : "Ready";
    const buttonTitle = isOpponentReady ? "Start Game" : "Ready";
    const buttonIcon = isOpponentReady ? <FaPlay /> : <FaDiceD6 />;
    return <RetroBtn label={buttonLabel} onClick={() => { initGame(); setIsLocalReady(true); }} title={buttonTitle} color="success" size="sm">{buttonIcon}</RetroBtn>;
  }

  if (gameMode === null) {
    return (
      <div className="app">
        <HeaderWrapper>
          <Title>
            <div className="header-wrap">
              <h1>Battleship</h1>
            </div>
          </Title>
        </HeaderWrapper>
        <DisplayWrapper>
          <Display style={{flexDirection: 'column', gap: '1rem'}}>
            <h2>Select Game Mode</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: 'bold'}}>Map Size</label>
              <select 
                value={boardSize} 
                onChange={(e) => setBoardSize(parseInt(e.target.value))}
                style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc'}}
              >
                <option value={10}>10 x 10 (Standard)</option>
                <option value={15}>15 x 15 (Large)</option>
                <option value={20}>20 x 20 (Massive)</option>
                <option value={25}>25 x 25 (Epic)</option>
                <option value={30}>30 x 30 (Gigantic)</option>
              </select>
            </div>
            <Buttons>
              <RetroBtn label="Single Player (vs Computer)" onClick={() => {
                setGameMode('singleplayer');
                const seed = Math.floor(Math.random() * 1000000);
                const mapData = generateUnifiedMap(boardSize, seed);
                
                const singleGame = new Game(ships, boardSize, [mapData.leftHeightMap, mapData.rightHeightMap], [mapData.leftTextureUrl, mapData.rightTextureUrl]);
                singleGame.getPlayer(0).setName(playerName);
                singleGame.getPlayer(0).setAvatar(localAvatar);
                setGame(singleGame);
                setMySeed(seed);
                setOpponentSeed(seed);
                setReset(true);
                setTimeout(() => setReset(false), 0);
              }} color="teal" size="md" />
              <RetroBtn label="Multiplayer" onClick={() => setGameMode('lobby')} color="primary" size="md" />
            </Buttons>
          </Display>
        </DisplayWrapper>
      </div>
    );
  }

  if (gameMode === 'lobby') {
    return (
      <div className="app">
        <HeaderWrapper>
          <Title>
            <div className="header-wrap">
              <h1>Battleship Lobby</h1>
            </div>
          </Title>
        </HeaderWrapper>
        <DisplayWrapper>
          <Display style={{flexDirection: 'column', gap: '1rem', width: '300px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: 'bold'}}>Player Name</label>
              <input 
                type="text" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)}
                style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc'}}
              />
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
              <label style={{fontWeight: 'bold'}}>Map Size (Host)</label>
              <select 
                value={boardSize} 
                onChange={(e) => setBoardSize(parseInt(e.target.value))}
                style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc'}}
              >
                <option value={10}>10 x 10 (Standard)</option>
                <option value={15}>15 x 15 (Large)</option>
                <option value={20}>20 x 20 (Massive)</option>
                <option value={25}>25 x 25 (Epic)</option>
                <option value={30}>30 x 30 (Gigantic)</option>
              </select>
            </div>

            <Buttons style={{margin: '1rem 0'}}>
              <RetroBtn label="Create New Room" onClick={createRoom} color="primary" size="md" />
            </Buttons>

            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <label style={{fontWeight: 'bold'}}>Join a Room</label>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <input 
                  type="text" 
                  placeholder="Room ID" 
                  value={roomId} 
                  onChange={(e) => setRoomId(e.target.value)}
                  style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1}}
                />
                <RetroBtn label="Join" onClick={() => handleJoinRoom(roomId)} color="success" size="sm" />
              </div>
            </div>

            <div style={{marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '1rem', margin: 0}}>Active Rooms ({lobbyRooms.length})</h3>
                <RetroBtn label="Refresh" onClick={() => socketRef.current?.emit('request_room_list')} color="info" size="sm" />
              </div>
              {lobbyRooms.length === 0 ? (
                <div style={{color: 'gray', fontSize: '0.9rem'}}>No active rooms waiting. Create one!</div>
              ) : (
                <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {lobbyRooms.map((room, idx) => (
                    <li key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
                      <div>
                        <strong>{room.roomId}</strong><br/>
                        <small>Host: {room.hostName}</small><br/>
                        <small>Map: {room.boardSize}x{room.boardSize}</small>
                      </div>
                      <RetroBtn label="Join" onClick={() => handleJoinRoom(room.roomId)} color="success" size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <RetroBtn label="Back" onClick={() => setGameMode(null)} color="secondary" size="sm" style={{marginTop: '1rem', alignSelf: 'center'}} />
          </Display>
        </DisplayWrapper>
      </div>
    );
  }

  return (
      <div className="app">
        <div className="header-wrap">
          <h1>Battleship</h1>
        </div>
      {gameMode === 'multiplayer' && (
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '2.4rem', margin: '0.25rem 0.75rem 0.5rem', fontWeight: 'bold'}}>
          <div style={{textAlign: 'center', padding: '0 5.5rem'}}>
            Room: {roomId} | Map: {boardSize}x{boardSize} | Status: {multiplayerStatus}
          </div>
          <div style={{position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)'}}>
            <RetroBtn label="Leave" onClick={leaveRoom} title="Leave Room" color="danger" size="sm">
              <FaSignOutAlt />
            </RetroBtn>
          </div>
        </div>
      )}
      {game.getWinner === 0 && <Confetti />}
      {game.getWinner === 0 && <Confetti />}
      <Boards 
        game={game} 
        updateTurn={updateTurn} 
        turn={turn} 
        init={init} 
        reset={reset} 
        gameMode={gameMode}
        socket={socketRef.current}
        roomId={roomId}
        playerIndex={playerIndex}
        isLocalReady={isLocalReady}
        isOpponentReady={isOpponentReady}
        hasOpponent={hasOpponent}
        opponentName={opponentName}
        opponentAvatar={opponentAvatar}
        playerName={playerName}
        localAvatar={localAvatar}
        mySeed={mySeed}
        opponentSeed={opponentSeed}
        autoPlay={autoPlay}
        autoPlayDelay={autoPlayDelay}
        toolbarButtons={<>
            {!init && (
              <>
                <RetroBtn label="Auto Place" onClick={randomizeShips} title="Auto Place" color="primary" size="sm">
                  <FaDiceD6 />
                </RetroBtn>
                <RetroBtn label="Renew Islands" onClick={regenerateIslands} title="Renew Islands" color="info" size="sm">
                  <FaRecycle />
                </RetroBtn>
              </>
            )}
            {init && (
              <>
                <RetroBtn
                  label={autoPlay ? "Stop Auto Play" : "Auto Play"}
                  onClick={() => setAutoPlay(!autoPlay)}
                  title={autoPlay ? "Stop Auto Play" : "Auto Play"}
                  color={autoPlay ? "success" : "secondary"}
                  size="sm"
                >
                  <FaRobot />
                </RetroBtn>
                {autoPlay && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <input
                      type="range"
                      min={0}
                      max={2000}
                      step={50}
                      value={autoPlayDelay}
                      onChange={(e) => setAutoPlayDelay(Number(e.target.value))}
                      style={{ width: '80px', cursor: 'pointer' }}
                      title={`Delay: ${autoPlayDelay}ms`}
                    />
                    <span style={{ fontSize: '0.65rem', color: '#888', minWidth: '2.5rem' }}>{autoPlayDelay}ms</span>
                  </div>
                )}
              </>
            )}
            {!init ? (gameMode === 'multiplayer' ? getMultiplayerButton() :
              <RetroBtn label="Start Game" onClick={initGame} title="Start Game" color="success" size="sm">
                <FaPlay />
              </RetroBtn>)
            : (gameMode === 'singleplayer' && (game.getTurn === 0 || game.getWinner !== -1)) || (gameMode === 'multiplayer' && game.getWinner !== -1) ?
              <RetroBtn label="Restart" onClick={restartGame} title="Restart Game" color="warning" size="sm">
                <FaUndo />
              </RetroBtn>
              : <RetroBtn label="Restart" title="Restart Game" disabled color="warning" size="sm">
                  <FaUndo />
                </RetroBtn>
            }
          </>}
      />
    </div>
  );
}

export default App;
