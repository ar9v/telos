// Requires
let express = require('express');
let morgan = require('morgan');
let bodyParser = require('body-parser');

// Setup
let app = express();
let jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(morgan('combined'));

// API

// Running and closing the server
app.listen("8080", () => {
    console.log("App is running on port 8080");
});

// Exports
