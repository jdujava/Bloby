var vector = require('./vectors.js');

function SpringNode(_x,_y) {
  this.stiffness = 0.6;
  this.damping = 0.65;

  this.pos = {x:_x,y:_y};
  this.vel = {x:0,y:0};
  this.acc = {x:0,y:0};
  this.radius = 5*windowScale;

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
    if(dist > 10*windowScale){
      a = mult(a,1/mag(a));
      dist -= 10*windowScale;
      var newMag = dist * this.stiffness*windowScale;
      a = mult(a,newMag);
      this.acc = add(this.acc,a);
    }
  }
}

function create(_x,_y) {
  return new SpringNode(_x,_y);
}

module.exports.create = create;
