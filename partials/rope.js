var vector = require('./vectors.js');
var vector = require('./springNode.js');

function Rope(x,y,id){
  this.spring = [];
  this.dist = 30*windowScale;
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
    this.t += 0.02;
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
    if(dist > 10*windowScale){
      a = mult(a,1/mag(a));
      dist -= 10*windowScale;
      var newMag = dist * 0.003;
      a = mult(a,newMag);
      blob.acc = add(blob.acc,a);
    }
  }
}

function create(x,y,id) {
  return new Rope(x,y,id);
}

module.exports.create = create;
