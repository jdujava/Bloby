function Pillar(_x,_y,id){
  this.pos = {x:_x,y:_y};
  this.id = id;
  this.t = 0;

  this.run = function () {
    this.t += 0.02;
    if (this.t > 3) {
      pillars.splice(0,1);
    }
  }
}

function create(_x,_y,id) {
  return new Pillar(_x,_y,id);
}

module.exports.create = create;
