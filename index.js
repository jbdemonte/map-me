var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', require('./server/handler'));

http.listen(3000, function () {
    console.log('listening on *:3000');
});
