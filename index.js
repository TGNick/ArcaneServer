const express = require("express");
const app = express();
const mongoose = require("mongoose");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const config = require("./Config/config.json");
const log = require("./structs/log.js");
const error = require("./structs/error.js");
const functions = require("./structs/functions.js");

// Load configuration
const PORT = 3551;
const tokensFilePath = "./tokenManager/tokens.json";
const configFilePath = "./Config/config.json";

const loadConfig = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath).toString());
    } catch (error) {
        log.error(`Failed to load configuration from ${filePath}`);
        throw error;
    }
};

const config = loadConfig(configFilePath);
const accessTokens = tokens.accessTokens;
const refreshTokens = tokens.refreshTokens;
const clientTokens = tokens.clientTokens;

// Remove expired tokens
const removeExpiredTokens = (tokens) => {
    const currentDate = new Date();
    for (let tokenType in tokens) {
        tokens[tokenType] = tokens[tokenType].filter(token => {
            const decodedToken = jwt.decode(token.token.replace("eg1~", ""));
            return DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire) > currentDate;
        });
    }
    return tokens;
};

const DateAddHours = (date, hours) => {
    date.setHours(date.getHours() + hours);
    return date;
};

const updatedTokens = removeExpiredTokens(tokens);
fs.writeFileSync(tokensFilePath, JSON.stringify(updatedTokens, null, 2));

// Connect to MongoDB
mongoose.connect(config.mongodb.database, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        log.backend("App successfully connected to MongoDB!");
    })
    .catch((error) => {
        log.error("MongoDB failed to connect, please make sure you have MongoDB installed and running.");
        log.error(error);
        process.exit(1); // Exit the process if MongoDB connection fails
    });

// Middleware for handling endpoint not found errors
const handleNotFoundError = (req, res, next) => {
    error.createError(
        "errors.com.epicgames.common.not_found", 
        "Sorry, the resource you were trying to find could not be found", 
        undefined, 1004, undefined, 404, res
    );
};

// Apply rate limiting middleware
app.use(rateLimit({ windowMs: 0.5 * 60 * 1000, max: 45 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load routes dynamically
fs.readdirSync("./routes").forEach(fileName => {
    app.use(require(`./routes/${fileName}`));
});

// Start the server
const server = app.listen(PORT, () => {
    log.backend(`App started listening on port ${PORT}`);
    require("./xmpp/xmpp.js");
    require("./DiscordBot");
});

// Error handling for server start
server.on("error", async (err) => {
    if (err.code == "EADDRINUSE") {
        log.error(`Port ${PORT} is already in use!`);
        await functions.sleep(3000);
        process.exit(1); // Exit the process if the port is already in use
    } else {
        log.error("An error occurred while starting the server:");
        log.error(err);
        process.exit(1); // Exit the process if any other error occurs during server start
    }
});

// Endpoint not found handler
app.use(handleNotFoundError);
