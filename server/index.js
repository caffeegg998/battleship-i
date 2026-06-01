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
      publicRooms.push({ roomId, hostName: room.playerNames[room.players[0]] || 'Unknown' });
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

  socket.on('join_room', ({ roomId, playerName, avatar }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], readyCount: 0, layouts: {}, playerNames: {}, playerAvatars: {} });
    }
    
    const room = rooms.get(roomId);
    
    if (room.players.length < 2) {
      const playerIndex = room.players.length; // 0 or 1
      room.players.push(socket.id);
      room.playerNames[socket.id] = playerName || `Player ${playerIndex + 1}`;
      room.playerAvatars[socket.id] = avatar || '';
      
      socket.emit('player_assigned', playerIndex);
      console.log(`User ${socket.id} (${room.playerNames[socket.id]}) joined room ${roomId} as player ${playerIndex}`);
      
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

    room.readyCount++;
    const playerIndex = room.players.indexOf(socket.id);
    room.layouts[playerIndex] = ships;

    // Notify the other player that this player is ready
    socket.to(roomId).emit('opponent_ready');

    if (room.readyCount === 2) {
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
    }
  });

  socket.on('attack', ({ roomId, loc }) => {
    socket.to(roomId).emit('attack', loc);
  });

  socket.on('restart_game', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.readyCount = 0;
      room.layouts = {};
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
