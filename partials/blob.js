var vector = require('./vectors.js');
var pillar_skeleton = require('./pillar.js');
var rope_skeleton = require('./rope.js');
var omega = 0.06;

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
  this.pillared = false;
  this.hookID;

  this.run = function () {
    this.borders();
    this.update();
  }

  this.applyForce = function(f){
    this.acc = vector.add(this.acc,f);
  }

  this.charge = function(){
    this.ch = 3.125;
    this.omega *= -1;
    this.rotating = false;
  }

  this.release = function(){
    this.ch = -20;
    var x = Math.cos(this.theta)*Math.pow(this.f/30,2)*windowScale;
    var y = Math.sin(this.theta)*Math.pow(this.f/30,2)*windowScale;
    var f = {x:x,y:y};
    this.applyForce(f);
    this.rotating = true;
  }

  this.update = function(){
    this.vel = vector.add(this.vel,this.acc);
    this.pos = vector.add(this.pos,this.vel);
    this.acc = vector.mult(this.acc, 0);
    if (this.rotating) {
      this.theta += this.omega;
    }
    this.f += this.ch;
    this.f = Math.max(0,Math.min(60,this.f));
  }

  this.throwHook = function(id,x,y) {
    var hook = rope_skeleton.create(x,y,id);
    hook.addSpring();
    hooks.push(hook);
    this.hooked = true;
  }

  this.flash = function(_x,_y) {
    var newPos = { x : _x, y : _y };
    for (var i = 0; i < blobs.length; i++) {
      var diff = vector.sub(newPos , blobs[i].pos);
      if( vector.mag(diff) < 62*windowScale){
        var len = 62*windowScale - vector.mag(diff);
        diff = vector.mult(diff,len/vector.mag(diff));
        newPos = vector.add(newPos,diff);
        break;
      }
    }
    this.pos.x = newPos.x;
    this.pos.y = newPos.y;
    this.flashed = true;
  }

  this.pillar = function(x,y,id) {
    var pillar = pillar_skeleton.create(x,y,id);
    pillars.push(pillar);
    this.pillared = true;
  }

  this.borders = function(){
    if (vector.mag(vector.sub(this.pos,{x:500,y:400}))>320) {
      this.score--;
      if (this.hooked) {
        this.hooked = false;
        for (var i = 0; i < hooks.length; i++) {
          if(hooks[i].id == this.id){
            hooks.splice(i,1);
          }
        }
      }
      this.vel = vector.mult(this.vel,0);
      this.ch = -20*windowScale;
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
    var diff = vector.sub(this.pos,other.pos);
    var dist = vector.mag(diff);
    if (dist <= this.r*2*windowScale) {
      var len = (61*windowScale - dist)*0.5;
      diff = vector.mult(diff,len/dist);
      this.pos = vector.add(this.pos,diff);
      other.pos = vector.sub(other.pos,diff);
      diff =vector. mult(diff, 1/len);
      var p = this.vel.x * diff.x + this.vel.y * diff.y - other.vel.x * diff.x - other.vel.y * diff.y;
      var f1 = vector.mult(diff, -p);
      var f2 = vector.mult(diff, p);
      this.applyForce(f1);
      other.applyForce(f2);
      this.touch = other.id;
      other.touch = this.id;
    }
  }

  this.hitPillar = function(pillar) {
    var diff = vector.sub(this.pos , pillar.pos);
    var dist = vector.mag(diff);
    if( dist < this.r*2*windowScale){
      var len = 61*windowScale - dist;
      diff = vector.mult(diff,len/dist);
      this.pos = vector.add(this.pos,diff);
      diff = vector.mult(diff, 1/len);
      var p = 2*this.vel.x * diff.x + 2*this.vel.y * diff.y;
      var f1 = vector.mult(diff, -p);
      this.applyForce(f1);
      if(this.id !== pillar.id) this.touch = pillar.id;
    }
  }
}

function create(_x,_y,t,id,n) {
  return new Blob(_x,_y,t,id,n);
}

module.exports.create = create;
