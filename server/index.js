const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

const getPublicRooms = () => {
  const publicRooms = [];
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 1) {
      publicRooms.push({ 
        roomId, 
        hostName: room.playerNames[room.players[0]] || 'Unknown',
        boardSize: room.boardSize
      });
    }
  }
  return publicRooms;
};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);
  socket.emit('room_list', getPublicRooms());

  socket.on('request_room_list', () => {
    socket.emit('room_list', getPublicRooms());
  });

  socket.on('join_room', ({ roomId, playerName, avatar, boardSize }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      // Room creator sets the board size and generates unique seeds for both players
      rooms.set(roomId, { 
        players: [], 
        isReady: [false, false], 
        layouts: {}, 
        playerNames: {}, 
        playerAvatars: {},
        boardSize: boardSize || 10,
        seeds: [Math.floor(Math.random() * 1000000), Math.floor(Math.random() * 1000000)]
      });
    }
    
    const room = rooms.get(roomId);
    
    if (room.players.length < 2) {
      const playerIndex = room.players.length; // 0 or 1
      room.players.push(socket.id);
      room.playerNames[socket.id] = playerName || `Player ${playerIndex + 1}`;
      room.playerAvatars[socket.id] = avatar || '';
      
      // Send both seeds, telling the player which one is theirs
      socket.emit('player_assigned', { 
        index: playerIndex, 
        boardSize: room.boardSize,
        mySeed: room.seeds[playerIndex],
        opponentSeed: room.seeds[1 - playerIndex]
      });
      console.log(`User ${socket.id} (${room.playerNames[socket.id]}) joined room ${roomId} as player ${playerIndex} (Size: ${room.boardSize})`);
      
      if (room.players.length === 2) {
        const p0Id = room.players[0];
        const p1Id = room.players[1];
        io.to(p0Id).emit('all_players_connected', { 
          opponentName: room.playerNames[p1Id],
          opponentAvatar: room.playerAvatars[p1Id]
        });
        io.to(p1Id).emit('all_players_connected', { 
          opponentName: room.playerNames[p0Id],
          opponentAvatar: room.playerAvatars[p0Id]
        });
      }
      
      // Update everyone's room list
      io.emit('room_list', getPublicRooms());
    } else {
      socket.emit('error', 'Room is full');
    }
  });

  socket.on('ships_ready', ({ roomId, ships }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.indexOf(socket.id);
    if (!room.isReady[playerIndex]) {
      room.isReady[playerIndex] = true;
      room.layouts[playerIndex] = ships;
      socket.to(roomId).emit('opponent_ready');
    }

    if (room.isReady[0] && room.isReady[1]) {
      // Send P1's layout to P0, and P0's layout to P1
      const p0Id = room.players[0];
      const p1Id = room.players[1];

      io.to(p0Id).emit('game_start', { 
        opponentShips: room.layouts[1],
        opponentName: room.playerNames[p1Id],
        opponentAvatar: room.playerAvatars[p1Id]
      });
      io.to(p1Id).emit('game_start', { 
        opponentShips: room.layouts[0],
        opponentName: room.playerNames[p0Id],
        opponentAvatar: room.playerAvatars[p0Id]
      });
      console.log(`Game started in room ${roomId}`);
      
      // Reset readiness for potential rematch
      room.isReady = [false, false];
    }
  });

  socket.on('attack', ({ roomId, loc }) => {
    socket.to(roomId).emit('attack', loc);
  });

  socket.on('renew_islands', ({ roomId, newSeed, playerName, avatar }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const playerIndex = room.players.indexOf(socket.id);
    if (playerIndex !== -1) {
      room.seeds[playerIndex] = newSeed;
      room.playerNames[socket.id] = playerName || room.playerNames[socket.id];
      room.playerAvatars[socket.id] = avatar || room.playerAvatars[socket.id];
      socket.to(roomId).emit('opponent_renewed_islands', { 
        playerIndex, 
        newSeed,
        opponentName: room.playerNames[socket.id],
        opponentAvatar: room.playerAvatars[socket.id]
      });
    }
  });

  socket.on('restart_game', (roomId, callback) => {
    const room = rooms.get(roomId);
    if (room) {
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex !== -1) {
        room.isReady[playerIndex] = false;
        delete room.layouts[playerIndex];
        
        socket.to(roomId).emit('opponent_unready');
        
        if (typeof callback === 'function') {
          const opponentIndex = playerIndex === 0 ? 1 : 0;
          callback(room.isReady[opponentIndex]);
        }
      }
    }
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if (room && room.players.includes(socket.id)) {
      socket.to(roomId).emit('opponent_disconnected');
      rooms.delete(roomId);
      io.emit('room_list', getPublicRooms());
      console.log(`User ${socket.id} left room ${roomId}. Room deleted.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        io.to(roomId).emit('opponent_disconnected');
        rooms.delete(roomId);
        io.emit('room_list', getPublicRooms());
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
