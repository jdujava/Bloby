
var express = require('express');

var app = express();

app.set('port', (5000));
var server = app.listen(5000);

app.use(express.static(__dirname + '/public'));

var socket = require('socket.io');
var io = socket(server);


var peopleCounter = 0;

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  peopleCounter++;
  io.sockets.emit("count",peopleCounter);

  socket.on('disconnect', disconnect);

  function disconnect(socket) {
    peopleCounter--;
    io.sockets.emit("count",peopleCounter);
  }
}
