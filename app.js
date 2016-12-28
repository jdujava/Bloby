
var express = require('express');
var uuid = require('uuid');
var blob_skeleton = require('./partials/blob.js');

var app = express();

app.set('port', (process.env.PORT || 5000));
var server = app.listen(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

var socket = require('socket.io');
var io = socket(server);

var blobs = [];
var hooks = [];
var pillars = [];
var peopleCounter = 0;
var windowScale = 1;

function byID(id){
  for (var i = 0; i < blobs.length; i++) {
    if(id === blobs[i].id){
      return blobs[i];
    }
  }
}
function newLocation() {
  while (true) {
    var bool = true;
    var newPos = { x : (350 + Math.random()*300), y : (250 + Math.random()*300) };
    for (var i = 0; i < blobs.length; i++) {
      if( mag(sub(blobs[i].pos , newPos)) < 80*windowScale) bool = false;
    }
    if (bool) {
      return newPos;
    }
  }
}
function scaleWindow(){
  windowScale = 1.1 - 0.04*blobs.length;
}

setInterval(heartbeat,20);
setInterval(physics,20);

function heartbeat() {
  var data = {
    blobs : blobs,
    hooks : hooks,
    pillars : pillars
  }
  var data = JSON.stringify(data);
  io.sockets.emit("heartbeat", data);
}
function physics() {
  for (var i = 0; i < pillars.length; i++) {
    pillars[i].run();
  }
  for (var i = 0; i < blobs.length-1; i++) {
    for (var j = i+1; j < blobs.length; j++) {
      blobs[i].collision(blobs[j]);
    }
  }
  for (var i = 0; i < hooks.length; i++) {
    if (hooks[i].active) {
      hooks[i].run();
    }
  }
  for (var i = 0; i < blobs.length; i++) {
    for (var k = 0; k < pillars.length; k++) {
      blobs[i].hitPillar(pillars[k]);
    }
    blobs[i].run();
  }
}

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  peopleCounter++;

  var id = uuid();
  socket.emit("id",id);

  socket.on('disconnect', disconnect);
  socket.on('start', start);
  socket.on('press', press);
  socket.on('release', release);
  socket.on('hook', hook);
  socket.on('left', left);
  socket.on('flash', flash);
  socket.on('pillar', pillar);
  socket.on('plsRespond', function () {
    socket.emit("getPing");
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  function disconnect() {
    for (var i = 0; i < blobs.length; i++) {
      if(id == blobs[i].id){
        blobs.splice(i,1);
        scaleWindow();
        io.sockets.emit("scale",windowScale);
      }
    }
    for (var i = 0; i < hooks.length; i++) {
      if(hooks[i].id == id){
        hooks.splice(i,1);
      }
    }
    console.log(id);
    peopleCounter--;
    scaleWindow();
    io.sockets.emit("scale",windowScale);
    // io.sockets.emit("count",peopleCounter);
  }
  function start(data) {
    var newPos = newLocation();
    var blob = blob_skeleton.create(newPos.x,newPos.y,data.t,data.id,data.name);
    blobs.push(blob);
    scaleWindow();
    io.sockets.emit("scale",windowScale);
  }
  function press(id) {
    if (byID(id)) {
      byID(id).charge();
    }
  }
  function release(id) {
    if (byID(id)) {
      byID(id).release();
    }
  }
  function hook(data) {
    if (!byID(data.id).hooked) {
      byID(data.id).throwHook(data.id,data.x,data.y);
      setTimeout(function () {
        if (byID(id)) {
          byID(id).hooked = false;
        }
      },7000);
    }
  }
  function left(id) {
    for (var i = 0; i < hooks.length; i++) {
      if(hooks[i].id == id){
        hooks.splice(i,1);
      }
    }
  }
  function flash(data) {
    if (!byID(data.id).flashed) {
      byID(data.id).flash(data.x,data.y);
      setTimeout(function () {
        if (byID(id)) {
          byID(id).flashed = false;
        }
      },7000);
    }
  }
  function pillar(data) {
    if (!byID(data.id).pillared) {
      byID(data.id).pillar(data.x,data.y,data.id);
      setTimeout(function () {
        if (byID(id)) {
          byID(id).pillared = false;
        }
      },7000);
    }
  }

}
