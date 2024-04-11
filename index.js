import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, '')));

const PASSWORD = "1337"; // Lykilorð sem FASTI

let onlineUsers = [];

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Notandi tengdist');

  socket.emit('authenticate'); // Láta notenda slá inn lykilorðið

  socket.on('authenticate', (password) => {
    if (password === PASSWORD) {
      console.log('Auðkenning tókst');
      socket.emit('chooseName'); 
    } else {
      console.log('Auðkenning mistókst');
      socket.disconnect(true); // Disconnect svo að notandi geti ekki haldið áfram inn á spjallið
    }
  });

  socket.on('chooseName', (userName) => {
    socket.userName = userName;
    onlineUsers.push(userName);
    io.emit('updateOnlineUsers', onlineUsers);
  });

  socket.on('disconnect', () => {
    console.log('Notandi aftengdist');
    const index = onlineUsers.indexOf(socket.userName);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
    }
    io.emit('updateOnlineUsers', onlineUsers);
  });

  socket.on('chat message', (msg) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateTime = currentDate + ' ' + currentTime;
    io.emit('chat message', { time: dateTime, user: socket.userName, message: msg });
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
