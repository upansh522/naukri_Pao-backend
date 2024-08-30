const express = require("express");
const cors = require("cors");
const app = express();
const routers = require('./routes/user'); // Ensure this path is correct
const cookieParser = require("cookie-parser");
const checkAuthentication=require('./middlewares/authenticationToLogin');

// Middlewares
app.use(cors({
    origin: true, // Allow this origin to access your server
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(cookieParser());
app.use(checkAuthentication("User_token"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Use the router
app.use('/', routers);

// Setup server
const PORT = process.env.PORT || 8080;  // Use environment variable PORT or default to 8080
app.listen(PORT, () => {
    console.log("Server started on PORT", PORT);
});
