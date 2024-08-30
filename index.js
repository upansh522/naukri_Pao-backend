const express = require("express");
const cors = require("cors");
const app = express();
const routers = require('./routes/user'); // Ensure this path is correct

// Middlewares
app.use(cors({
    origin: 'http://localhost:5173', // Allow this origin to access your server
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the router
app.use('/', routers);

// Setup server
const PORT = process.env.PORT || 8080;  // Use environment variable PORT or default to 8080
app.listen(PORT, () => {
    console.log("Server started on PORT", PORT);
});
