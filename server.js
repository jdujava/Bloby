var blobs = [];
var peopleCounter = 0;

function Blob(x,y,t,f,id){
  this.id = id;
  this.x = x;
  this.y = y;
  this.t = t;
  this.f = f;
}

var express = require('express');

var app = express();

app.set('port', (process.env.PORT || 5000));
var server = app.listen(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

var socket = require('socket.io');
var io = socket(server);

setInterval(heartbeat,33);

function heartbeat() {
  io.sockets.emit("heartbeat", blobs);
}

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  peopleCounter++;
  io.sockets.emit("count",peopleCounter);

  socket.on('disconnect', disconnect);
  socket.on('start', start);
  socket.on('update', update);

  function disconnect(socket) {
    for (var i = 0; i < blobs.length; i++) {
      if(socket.id == blobs[i].id){
        blobs.splice(i,1);
      }
    }
    console.log(socket.id);
    peopleCounter--;
    io.sockets.emit("count",peopleCounter);
  }
  function start(data) {
    var blob = new Blob(data.x,data.y,data.t,data.f,socket.id);
    blobs.push(blob);
  }
  function update(data) {
    var blob;
    for (var i = 0; i < blobs.length; i++) {
      if(socket.id === blobs[i].id){
        blob = blobs[i];
      }
    }

    blob.x = data.x;
    blob.y = data.y;
    blob.t = data.t;
    blob.f = data.f;

  }
}
