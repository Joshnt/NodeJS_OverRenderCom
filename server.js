const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(join(__dirname, 'public')));

let choices = {
  player: [] // Array to store player choices mit id, type, index
}

//#region load images
// Function to recursively get all image paths
const getImagePaths = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        // Recursively go through subdirectories
        results = results.concat(getImagePaths(filePath));
      } else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
        // Check if the file is an image (you can add other extensions if needed)
        results.push(filePath.replace(path.join(__dirname, 'public'), '').replace(/\\/g, '/'));
      }
    });
    return results;
  };
  
  // Endpoint to get image paths
  app.get('/api/images', (req, res) => {
    const imagesDirectory = path.join(__dirname, 'public', 'assets', 'images');
    const imagePaths = getImagePaths(imagesDirectory);
    res.json(imagePaths); // Send the image paths as a JSON response
    console.log("Sent image paths to client: ", imagePaths);
  });
//#endregion load images

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });


io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);    

    // 
    socket.on("joinRoom", (roomName) => {
      socket.join(roomName);
      socket.data.room = roomName;
      const room = io.sockets.adapter.rooms.get(roomName);
      const numClients = room ? room.size : 0;
      socket.emit("playerNumInfo", numClients)
      choices.player[socket.id] = {};
      console.log(`Socket ${socket.id} joined room '${roomName}' with ID ${numClients}`);
    });

    // When this client sends a "data" event...
    socket.on("data", (msg) => {
        console.log("Received data from " + socket.id + ": " + msg);
        io.to("unity").emit("data", msg);
    });

    socket.on("cardsPlayer", (type, index) => {
      console.log("Received data from " + socket.id + ": " + type + " " + index);

      choices.player[socket.id].type = index;
      for (let key in choices.player) {
        if (key != socket.id) {
          socket.broadcast.emit("cardsPlayer_other", key, type, index);
        }
      }
      io.to("unity").emit("cardsPlayer", type, socket.id, index);
  });

    // When this client sends a "unity" event...
    socket.on("unity", (msg) => {
        console.log("Received data from unity" + socket.id + ": " + msg);
        io.to("PlayerRoom").emit("unity", msg);
    });

    socket.on("log", (msg) => {
        console.log("Received log message" + socket.id + ": " + msg);
    });

    // (Optional) Log when the client disconnects.
    socket.on("disconnect", () => {
      delete choices.player[socket.id];
      console.log("Client disconnected: " + socket.id);
      const room = io.sockets.adapter.rooms.get(socket.data.room);
      const numClients = room ? room.size : 0;
      socket.emit("playerNumInfo", numClients);
    });
});

