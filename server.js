// Print a startup message on the server console
console.log("Starting server...");

// 1. Import Express and create an application instance.
const express = require("express");
const app = express();

// 2. Define the port using the environment variable (for Render) or default to 3000.
const port = process.env.PORT || 3000;

// 3. Start an HTTP server using the Express app.
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}!`);
});

// 4. Set up Express to serve static files from the "public" directory.
app.use(express.static("public"));

// Route: /controller-a ➝ index-a.html
app.get("/move_controller", (req, res) => {
    res.sendFile(__dirname + "/public/move_controller/index.html");
});

// Route: /controller-b ➝ index-b.html
app.get("/jump_controller", (req, res) => {
    res.sendFile(__dirname + "/public/jump_controller/index.html");
});

// 5. Import and initialize Socket.IO with the created server.
const socketio = require("socket.io");
const io = socketio(server);

// 6. Listen for new Socket.IO connections.
io.on("connection", (socket) => {
    console.log("New client connected: " + socket.id);

    // Listen for a "maxClient" event which signals that this socket is the Max client.
    socket.on("joinRoom", (roomName) => {
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room '${roomName}'`);
    });

    // When this client sends a "data" event...
    socket.on("data", (msg) => {
        console.log("Received data from " + socket.id + ": " + msg);
        // Only forward ("broadcast") the message to the "max" room.
        io.to("max").emit("data", msg);
        io.to("unity").emit("data", msg);
    });

    // (Optional) Log when the client disconnects.
    socket.on("disconnect", () => {
        console.log("Client disconnected: " + socket.id);
    });
});
