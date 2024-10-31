const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/connectDB');
const router = require('./routes/index');
const cookiesParser = require('cookie-parser');
const { app, server, io } = require('./socket/index');
const getUserDetailsFromToken = require('./helpers/getUserDetailsFromToken'); // Ensure this import is correct

// Middleware setup
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(cookiesParser());

const PORT = process.env.PORT || 8080;

app.get('/', (request, response) => {
    response.json({
        message: "Server running at " + PORT
    });
});

// API endpoints
app.use('/api', router);

// Socket.IO connection handling
io.on('connection', async (socket) => {
    console.log("Connected User: ", socket.id);

    const token = socket.handshake.auth.token; // Fetch the token from the connection
    console.log("Token: ", token); // Log the token for debugging

    // Fetch user details using the token
    const user = await getUserDetailsFromToken(token);
    console.log("User: ", user); // Log user details for debugging

    if (user && user._id) {
        // Create a room for the user
        socket.join(user._id.toString());

        // Add your event handlers for socket messages, etc.
        // For example:
        socket.on('message-page', async (userId) => {
            console.log('UserId: ', userId);
            // Add message page handling logic here
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Disconnected User: ', socket.id);
        });
    } else {
        console.error("User not authenticated or user ID is missing.");
        socket.emit("error", { message: "User not authenticated." });
    }
});

// Connect to the database and start the server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server running at " + PORT);
    });
}).catch(error => {
    console.error("Database connection error:", error);
});
