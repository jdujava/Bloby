
var express = require('express');
var uuid = require('uuid');

var app = express();

app.set('port', (process.env.PORT || 5000));
var server = app.listen(process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

var socket = require('socket.io');
var io = socket(server);

var blobs = [];
var hooks = [];
var peopleCounter = 0;
var omega = 0.06;

var add = function(a,b) { return { x:(a.x+b.x).fixed(), y:(a.y+b.y).fixed() }; };
var sub = function(a,b) { return { x:(a.x-b.x).fixed(),y:(a.y-b.y).fixed() }; };
var mult = function(a,b) { return {x: (a.x*b).fixed() , y:(a.y*b).fixed() }; };
var mag = function(a) {return (Math.sqrt(Math.pow(a.x,2)+Math.pow(a.y,2))).fixed()};

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
      if( mag(sub(blobs[i].pos , newPos)) < 80) bool = false;

    }
    if (bool) {
      return newPos;
    }
  }
}


Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

function Rope(x,y,id){
  this.spring = [];
  this.dist = 30;
  this.id = id;
  this.joint = {x:x, y:y};
  this.t = 0;
  this.active = false;

  this.run = function() {
    if (this.spring.length == 1) {
      var m = this.joint;
      var n = byID(this.id).pos;
      this.spring[0].run(m,n);
    }else {
      for(var i = 0; i < this.spring.length; i++){
        var a = this.spring[i];
        if(i == 0){
          var m = this.joint;
          var n = this.spring[i+1].pos;
        }else if(i == this.spring.length-1){
          var m = this.spring[i-1].pos;
          var n = byID(this.id).pos;
        }else{
          var m = this.spring[i-1].pos;
          var n = this.spring[i+1].pos;
        }
        a.run(m,n);
      }
    }
    this.t += 0.016;
    if (this.t > 3) {
      hooks.splice(0,1);
    }
    if (this.spring[this.spring.length - 1]) {
      this.pull(byID(this.id));
    }
  }

  this.addSpring = function(){
    var diff = sub(this.joint,byID(this.id).pos);
    var dist = mag(diff);
    var count = Math.max(Math.ceil(dist/this.dist),3);
    var diff = mult(diff, 1/count);
    for (var i = 1; i < count-1; i++) {
      var x = byID(this.id).pos.x + i*diff.x;
      var y = byID(this.id).pos.y + i*diff.y;
      this.spring.push(new SpringNode(x,y));
    }
    this.active = true;
  }
  this.pull = function(blob) {
    var a = sub(this.spring[this.spring.length - 1].pos, blob.pos);
    var dist = mag(a);
    if(dist > 10){
      a = mult(a,1/mag(a));
      dist -= 10;
      var newMag = dist * 0.003;
      a = mult(a,newMag);
      blob.acc = add(blob.acc,a);
    }
  }
}

function SpringNode(_x,_y) {
  this.stiffness = 0.4;
  this.damping = 0.70;

  this.pos = {x:_x,y:_y};
  this.vel = {x:0,y:0};
  this.acc = {x:0,y:0};
  this.radius = 5;

  this.run = function(prev1, prev2) {
    this.update(prev1.x,prev1.y, prev2.x,prev2.y);
    // this.display(prev1.x,prev1.y);
  }

 this.update = function(x1, y1, x2, y2) {
    var target1 = {x:x1,y:y1};
    var target2 = {x:x2,y:y2};
    this.applyForce(target1);
    this.applyForce(target2);
    this.vel = mult(add(this.vel,this.acc),this.damping);
    this.pos = add(this.pos,this.vel);
    this.acc = mult(this.acc, 0);
  }

  this.applyForce = function(t){
    var a = sub(t, this.pos);
    var dist = mag(a);
    if(dist > 10){
      a = mult(a,1/mag(a));
      dist -= 10;
      var newMag = dist * this.stiffness;
      a = mult(a,newMag);
      this.acc = add(this.acc,a);
    }
  }
}

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
  this.hooked = false;
  this.flashed = false;
  this.hookID;

  this.run = function () {
    this.borders();
    this.update();
  }

  this.applyForce = function(f){
    this.acc = add(this.acc,f);
  }

  this.charge = function(){
    this.ch = 2.5;
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
    this.vel = add(this.vel,this.acc);
    this.pos = add(this.pos,this.vel);
    this.acc = mult(this.acc, 0);
    if (this.rotating) {
      this.theta += this.omega;
    }
    this.f += this.ch;
    this.f = Math.max(0,Math.min(60,this.f));
  }

  this.throwHook = function(id,x,y) {
    var hook = new Rope(x,y,id);
    hook.addSpring();
    hooks.push(hook);
    this.hooked = true;
  }

  this.flash = function(_x,_y) {
    var newPos = { x : _x, y : _y };
    for (var i = 0; i < blobs.length; i++) {
      var diff = sub(newPos , blobs[i].pos);
      if( mag(diff) < 62){
        var len = 62 - mag(diff);
        diff = mult(diff,len/mag(diff));
        newPos = add(newPos,diff);
        break;
      }
    }
    this.pos.x = newPos.x;
    this.pos.y = newPos.y;
    this.flashed = true;
  }

  this.borders = function(){
    if (mag(sub(this.pos,{x:500,y:400}))>320) {
      this.score--;
      if (this.hooked) {
        this.hooked = false;
        for (var i = 0; i < hooks.length; i++) {
          if(hooks[i].id == this.id){
            hooks.splice(i,1);
          }
        }
      }
      this.vel = mult(this.vel,0);
      this.ch = -20;
      this.f = 0;
      this.rotating = true;
      if (this.touch) {
        if (byID(this.touch)) {
          byID(this.touch).score ++;
        }
        this.touch = undefined;
      }
      var newPos = newLocation();
      this.pos.x = newPos.x;
      this.pos.y = newPos.y;
    }
  }

  this.collision = function(other){
    var dif = sub(this.pos,other.pos);
    var dist = mag(dif);
    if (dist <= this.r*2) {
      dif = mult(dif, 1/dist);
      var p = this.vel.x * dif.x + this.vel.y * dif.y - other.vel.x * dif.x - other.vel.y * dif.y;
      var f1 = mult(dif, -p);
      var f2 = mult(dif, p);
      this.applyForce(f1);
      other.applyForce(f2);
      this.touch = other.id;
      other.touch = this.id;
    }
  }


}



setInterval(heartbeat,16);
setInterval(physics,16);

function heartbeat() {
  var blobsJSON = JSON.stringify(blobs);
  var hooksJSON = JSON.stringify(hooks);
  var data = {blobs : blobsJSON, hooks : hooksJSON};
  io.sockets.emit("heartbeat", data);
}
function physics() {
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
    blobs[i].run();
  }
}

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  peopleCounter++;
  // io.sockets.emit("count",peopleCounter);

  var id = uuid();
  socket.emit("id",id);

  socket.on('disconnect', disconnect);
  socket.on('start', start);
  socket.on('press', press);
  socket.on('release', release);
  socket.on('hook', hook);
  socket.on('left', left);
  socket.on('flash', flash);
  socket.on('plsRespond', function () {
    socket.emit("getPing");
  });

  function disconnect() {
    for (var i = 0; i < blobs.length; i++) {
      if(id == blobs[i].id){
        blobs.splice(i,1);
      }
    }
    for (var i = 0; i < hooks.length; i++) {
      if(hooks[i].id == id){
        hooks.splice(i,1);
      }
    }
    console.log(id);
    peopleCounter--;
    // io.sockets.emit("count",peopleCounter);
  }
  function start(data) {
    var newPos = newLocation();
    var blob = new Blob(newPos.x,newPos.y,data.t,data.id,data.name);
    blobs.push(blob);
  }
  function press(id) {
    byID(id).charge();
  }
  function release(id) {
    byID(id).release();
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

}
