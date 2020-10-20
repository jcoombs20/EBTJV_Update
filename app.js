var express = require('express');
var app = express();
var compression = require('compression');

app.use(compression());

app.use(express.static('/home/jason/ebtjv'));

app.listen(3122);

console.log("Running on 3122...");
