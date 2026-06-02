import React, { useState, useEffect, useRef } from 'react';
import Boards from "./components/Boards";
import Confetti from "./components/Confetti";
import Game from "./scripts/Game";
import { generateHeightMap } from "./scripts/Noise";
import { Display, DisplayWrapper, Buttons, Header, HeaderWrapper, Title } from "./components/styled_components/AppStyles";
import { FaWater } from "react-icons/fa";
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

        // Re-initialize game with correct board size and unique heightmaps
        const myMapData = generateHeightMap(boardSize, mySeed);
        const opponentMapData = generateHeightMap(boardSize, opponentSeed);
        
        const newGame = new Game(
          ships, 
          boardSize, 
          [myMapData.heightMap, opponentMapData.heightMap],
          [myMapData.textureUrl, opponentMapData.textureUrl]
        );
        newGame.getPlayer(0).setName(playerName);
        newGame.getPlayer(0).setAvatar(localAvatar);

        if (index === 1) {
            newGame.next();
            setTurn(newGame.getTurn);
            setHasOpponent(true); // If we are player 1, the host (player 0) is already here
        }
        setGame(newGame);
        setReset(true);
        setTimeout(() => setReset(false), 0);
      });

      socket.on('all_players_connected', ({ opponentName, opponentAvatar }) => {
        setHasOpponent(true);
        if (opponentName) {
          setOpponentName(opponentName);
          game.getPlayer(1).setName(opponentName);
        }
        if (opponentAvatar) {
          setOpponentAvatar(opponentAvatar);
          game.getPlayer(1).setAvatar(opponentAvatar);
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
        game.setOpponentShips(opponentShips);
        if (opponentName) {
          setOpponentName(opponentName);
          game.getPlayer(1).setName(opponentName);
        }
        if (opponentAvatar) {
          setOpponentAvatar(opponentAvatar);
          game.getPlayer(1).setAvatar(opponentAvatar);
        }
        game.init();
        updateInit();
        updateDisplay();
        setMultiplayerStatus('Game Started!');
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
        socket.off('opponent_disconnected');
        socket.off('error');
      };
    }
  }, [gameMode, game, playerName, localAvatar]);

  const updateDisplay = () => {
    if (!game.getInit) {
      setDisplay('Move/Rotate ships');
    } else if (game.getWinner !== -1) {
      // Locally, player 0 is always the local user.
      const winnerName = gameMode === 'multiplayer' 
        ? (game.getWinner === 0 ? "You" : (opponentName || "Opponent"))
        : game.getPlayer(game.getWinner).getName;
      setDisplay(`${winnerName} won!`);
    } else if (game.getInit) {
      if (game.getTurn === 0) {
        setDisplay('Your turn');
      } else {
        const nameToShow = gameMode === 'multiplayer' ? opponentName : game.getPlayer(1).getName;
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
      const shipsData = game.getPlayer(0).getBoard.getShips.map(s => ({
        length: s.getLength,
        origin: s.getOrigin,
        direction: s.getDirection,
        shipType: s.shipType
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

  const randomizeShips = () => {
    const board = game.getPlayer(0).getBoard;
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
    const myMapData = generateHeightMap(boardSize, mySeed);
    const opponentMapData = generateHeightMap(boardSize, opponentSeed);
    
    const newGame = new Game(
        ships, 
        boardSize, 
        [myMapData.heightMap, opponentMapData.heightMap],
        [myMapData.textureUrl, opponentMapData.textureUrl]
    );
    if (gameMode === 'multiplayer' && playerIndex === 1) {
        newGame.next();
    }

    // Preserve names
    newGame.getPlayer(0).setName(game.getPlayer(0).getName);
    newGame.getPlayer(1).setName(game.getPlayer(1).getName);

    setGame(newGame);
    setReset(true);
    setTimeout(() => setReset(false), 0);
    setTurn(newGame.getTurn);
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
      return <button className="startGame disabled" type="button">Waiting for opponent...</button>;
    }
    const buttonText = isOpponentReady ? "Start Game" : "Ready";
    return <button className="startGame" type="button" onClick={() => {
      initGame();
      setIsLocalReady(true);
    }}>{buttonText}</button>;
  }

  if (gameMode === null) {
    return (
      <div className="app">
        <HeaderWrapper>
          <Title>
            <FaWater/><Header>Battleship</Header><FaWater/>
          </Title>
        </HeaderWrapper>
        <DisplayWrapper>
          <Display style={{flexDirection: 'column', gap: '1rem'}}>
            <h2>Select Game Mode</h2>
            <Buttons>
              <button className="startGame" onClick={() => {
                setGameMode('singleplayer');
                const s1 = Math.floor(Math.random() * 1000000);
                const s2 = Math.floor(Math.random() * 1000000);
                const m1 = generateHeightMap(10, s1);
                const m2 = generateHeightMap(10, s2);
                
                const singleGame = new Game(ships, 10, [m1.heightMap, m2.heightMap]);
                singleGame.getPlayer(0).setName(playerName);
                singleGame.getPlayer(0).setAvatar(localAvatar);
                setGame(singleGame);
                setBoardSize(10);
                setMySeed(s1);
                setOpponentSeed(s2);
                setReset(true);
                setTimeout(() => setReset(false), 0);
              }}>Single Player (vs Computer)</button>
              <button className="startGame" onClick={() => setGameMode('lobby')}>Multiplayer</button>
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
            <FaWater/><Header>Battleship Lobby</Header><FaWater/>
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
              </select>
            </div>

            <Buttons style={{margin: '1rem 0'}}>
              <button className="startGame" onClick={createRoom} style={{width: '100%'}}>Create New Room</button>
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
                <button className="startGame" onClick={() => handleJoinRoom(roomId)} style={{padding: '0 1rem'}}>Join</button>
              </div>
            </div>

            <div style={{marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <h3 style={{fontSize: '1rem', margin: 0}}>Active Rooms ({lobbyRooms.length})</h3>
                <button className="startGame" style={{padding: '0.3rem 0.8rem', fontSize: '0.8rem', margin: 0}} onClick={() => socketRef.current?.emit('request_room_list')}>Refresh</button>
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
                      <button className="startGame" style={{padding: '0.3rem 0.8rem', fontSize: '0.8rem'}} onClick={() => handleJoinRoom(room.roomId)}>Join</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button className="startGame disabled" style={{marginTop: '1rem', alignSelf: 'center'}} onClick={() => setGameMode(null)}>Back</button>
          </Display>
        </DisplayWrapper>
      </div>
    );
  }

  return (
    <div className="app">
      <HeaderWrapper>
        <Title>
          <FaWater/><Header>Battleship</Header><FaWater/>
        </Title>
      </HeaderWrapper>
      {gameMode === 'multiplayer' && (
        <div style={{textAlign: 'center', margin: '0.5rem', fontWeight: 'bold'}}>
          Room: {roomId} | Map: {boardSize}x{boardSize} | Status: {multiplayerStatus}
        </div>
      )}
      <DisplayWrapper>
        <Display>
          <h2 className={"display"}>{display}</h2>
        </Display>
      </DisplayWrapper>
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
      />
      <Buttons>
        {!init && (
          <button className="startGame" type="button" onClick={randomizeShips} style={{ marginRight: '1rem' }}>
            Auto Place
          </button>
        )}
        {
          !init ? (gameMode === 'multiplayer' ? getMultiplayerButton() : <button className="startGame" type="button" onClick={initGame}>Start Game</button>)
          : (gameMode === 'singleplayer' && (game.getTurn === 0 || game.getWinner !== -1)) || (gameMode === 'multiplayer' && game.getWinner !== -1) ? 
            <button className="startGame" type="button" onClick={restartGame}>Restart Game</button>
            : <button className="startGame disabled" type="button">Restart Game</button>
        }
        {gameMode === 'multiplayer' && (
          <button className="startGame" type="button" onClick={leaveRoom} style={{ marginLeft: '1rem', backgroundColor: '#e74c3c', borderColor: '#c0392b' }}>
            Leave Room
          </button>
        )}
      </Buttons>
    </div>
  );
}

export default App;

