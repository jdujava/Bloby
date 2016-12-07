class Blob {
  constructor(x,y,t,r) {
    this.pos = createVector(x,y);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
    this.theta = t;
    this.omega = omega;
    this.r = r;
    this.f = 0;
    this.ch = 0;
    this.rotating = true;
  }

  run(){
    this.update();
    this.render();
  }

  applyForce(f){
    this.acc.add(f);
  }

  update(){
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    if (this.rotating) {
      this.theta += this.omega;
    }
    this.f += this.ch;
    this.f = max(0,min(100,this.f));
  }

  render(){
    push();
    translate(this.pos.x,this.pos.y);
    rotate(this.theta);
    stroke(0,0,255);
    fill(150,0,255);
    ellipse(0, 0, 2*this.r, 2*this.r);
    rect(this.r + 3, -5, this.f + 10, 10);
    pop();
  }

  collision(other){

  }
}
