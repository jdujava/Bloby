Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

function Blob(_x,_y,t,id) {
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

  this.run = function () {
    this.borders();
    this.update();
    this.render();
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

  this.render = function () {
    push();
    translate(this.pos.x,this.pos.y);
    rotate(this.theta);
    stroke(0,0,255);
    fill(150,0,255);
    ellipse(0, 0, 2*this.r, 2*this.r);
    rect(this.r + 3, -5, this.f + 10, 10);
    pop();
  }

  this.borders = function(){
    if (this.pos.x > 1000 || this.pos.x < 0) {
      this.vel.x *= -1;
    }
    if (this.pos.y > 800 || this.pos.y < 0) {
      this.vel.y *= -1;
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
    }
  }

  this.add = function(a,b) { return { x:(a.x+b.x).fixed(), y:(a.y+b.y).fixed() }; };
      //Subtract a 2d vector with another one and return the resulting vector
  this.sub = function(a,b) { return { x:(a.x-b.x).fixed(),y:(a.y-b.y).fixed() }; };
      //Multiply a 2d vector with a scalar value and return the resulting vector
  this.mult = function(a,b) { return {x: (a.x*b).fixed() , y:(a.y*b).fixed() }; };

  this.mag = function(a) {return (Math.sqrt(Math.pow(a.x,2)+Math.pow(a.y,2))).fixed()};
}
