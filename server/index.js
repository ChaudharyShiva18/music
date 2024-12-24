/**
 * server/index.js
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { router: downloadRouter, initSocketIO } = require('./routes/download');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // or your client URL
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Mount the download route
app.use('/api/download', downloadRouter);

// server/index.js (or wherever you're setting up routes)
const organizeRoute = require('./routes/organize');
// ...
app.use('/api/organize', organizeRoute);


// Pass our Socket.IO instance so download.js can emit events
initSocketIO(io);

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
