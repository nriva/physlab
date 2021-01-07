// Load Node modules
var express = require('express');
// Initialise Express
var app = express();
// Render static files
app.use(express.static('dist'));
// Port website will run on
app.listen(8080);