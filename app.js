
var express = require('express');
var uuid = require('uuid');

var app = express();

app.set('port', (process.env.PORT || 5000));
var server = app.listen(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

var socket = require('socket.io');
var io = socket(server);

var blobs = [];
var peopleCounter = 0;
var omega = 0.1;
var fr = 30;

function byID(id){
  for (var i = 0; i < blobs.length; i++) {
    if(id === blobs[i].id){
      return blobs[i];
    }
  }
}


Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

function Blob(_x,_y,t,id,n) {
  this.pos = {x:_x,y:_y};
  this.vel = {x:0,y:0};
  this.acc = {x:0,y:0};
  this.theta = t;
  this.omega = omega;
  this.r = 30;
  this.f = 0;
  this.ch = 0;
  this.rotating = true;
  this.id = id;
  this.name = n;
  this.score = 0;
  this.touch;

  this.run = function () {
    this.borders();
    this.update();
  }

  this.applyForce = function(f){
    this.acc = this.add(this.acc,f);
  }

  this.charge = function(){
    this.ch = 3;
    this.omega *= -1;
    this.rotating = false;
  }

  this.release = function(){
    this.ch = -20;
    var x = Math.cos(this.theta)*Math.pow(this.f/40,2);
    var y = Math.sin(this.theta)*Math.pow(this.f/40,2);
    var f = {x:x,y:y};
    this.applyForce(f);
    this.rotating = true;
  }

  this.update = function(){
    this.vel = this.add(this.vel,this.acc);
    this.pos = this.add(this.pos,this.vel);
    this.acc = this.mult(this.acc, 0);
    if (this.rotating) {
      this.theta += this.omega;
    }
    this.f += this.ch;
    this.f = Math.max(0,Math.min(100,this.f));
  }

  this.borders = function(){
    if (this.mag(this.sub(this.pos,{x:500,y:400}))>320) {
      this.score--;
      if (this.touch) {
        byID(this.touch).score ++;
        this.touch = undefined;
      }
      this.pos.x = 400 + Math.random()*200;
      this.pos.y = 300 + Math.random()*200;
      this.vel = this.mult(this.vel,0);
      this.ch = -20;
      this.f = 0;
      this.rotating = true;
    }
  }

  this.collision = function(other){
    var dif = this.sub(this.pos,other.pos);
    var dist = this.mag(dif);
    if (dist <= this.r*2) {
      dif = this.mult(dif, 1/dist);
      var p = this.vel.x * dif.x + this.vel.y * dif.y - other.vel.x * dif.x - other.vel.y * dif.y;
      var f1 = this.mult(dif, -p);
      var f2 = this.mult(dif, p);
      this.applyForce(f1);
      other.applyForce(f2);
      this.touch = other.id;
      other.touch = this.id;
    }
  }

  this.add = function(a,b) { return { x:(a.x+b.x).fixed(), y:(a.y+b.y).fixed() }; };
      //Subtract a 2d vector with another one and return the resulting vector
  this.sub = function(a,b) { return { x:(a.x-b.x).fixed(),y:(a.y-b.y).fixed() }; };
      //Multiply a 2d vector with a scalar value and return the resulting vector
  this.mult = function(a,b) { return {x: (a.x*b).fixed() , y:(a.y*b).fixed() }; };

  this.mag = function(a) {return (Math.sqrt(Math.pow(a.x,2)+Math.pow(a.y,2))).fixed()};
}



setInterval(heartbeat,33);
setInterval(physics,25);

function heartbeat() {
  io.sockets.emit("heartbeat", blobs);
}
function physics() {
  for (var i = 0; i < blobs.length-1; i++) {
    for (var j = i+1; j < blobs.length; j++) {
        blobs[i].collision(blobs[j]);
    }
  }
  for (var i = 0; i < blobs.length; i++) {
    blobs[i].run();
  }
}

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  peopleCounter++;
  io.sockets.emit("count",peopleCounter);

  var id = uuid();
  socket.emit("id",id);

  socket.on('disconnect', disconnect);
  socket.on('start', start);
  socket.on('press', press);
  socket.on('release', release);

  function disconnect() {
    for (var i = 0; i < blobs.length; i++) {
      if(id == blobs[i].id){
        blobs.splice(i,1);
      }
    }
    console.log(id);
    peopleCounter--;
    io.sockets.emit("count",peopleCounter);
  }
  function start(data) {
    var blob = new Blob(data.x,data.y,data.t,data.id,data.name);
    blobs.push(blob);
  }
  function press(id) {
    byID(id).charge();
  }
  function release(id) {
    byID(id).release();
  }

}
