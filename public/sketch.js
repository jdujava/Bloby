var socket;
var blobs = [];
var omega = 0.1;
var fr = 30;
var blob;

function setup() {
  frameRate(fr);
  createCanvas(1000,800);

  var p = document.getElementById('peopleCounter');

  socket = io.connect('https://bloby-game.herokuapp.com/');

  blob = new Blob(200,200,random(360));

  var data = {
    x : blob.pos.x,
    y : blob.pos.y,
    t : blob.theta,
    f : blob.f
  }
  socket.emit('start',data);

  socket.on('count', updateCount);
  socket.on('heartbeat', heartbeat);

  function updateCount(data) {
    p.innerHTML = "Počet pripojených ľudí : " + data;
  }
  function heartbeat(data) {
    blobs = data;
  }
}

function keyPressed() {
  blob.ch = 3;
  blob.omega *= -1;
  blob.rotating = false;
}

function touchStarted() {
  blob.ch = 3;
  blob.omega *= -1;
  blob.rotating = false;
}

function keyReleased() {
  blob.ch = -20;
  var x = cos(blob.theta)*pow(blob.f/40,2);
  var y = sin(blob.theta)*pow(blob.f/40,2);
  var f = createVector(x,y);
  blob.applyForce(f);
  blob.rotating = true;
}

function touchEnded() {
  blob.ch = -20;
  var x = cos(blob.theta)*pow(blob.f/40,2);
  var y = sin(blob.theta)*pow(blob.f/40,2);
  var f = createVector(x,y);
  blob.applyForce(f);
  blob.rotating = true;
}

function draw() {
  background(51);

  blob.run();
  var data = {
    x : blob.pos.x,
    y : blob.pos.y,
    t : blob.theta,
    f : blob.f
  }
  socket.emit('update', data);

  for (var i = 0; i < blobs.length; i++) {
    if (socket.id != blobs[i].id) {
      push();
      translate(blobs[i].x,blobs[i].y);
      rotate(blobs[i].t);
      stroke(0,0,255);
      fill(0,150,255);
      ellipse(0, 0, 60, 60);
      rect(33, -5, blobs[i].f + 10, 10);
      pop();
      fill(255);
      textAlign(CENTER);
      text(blobs[i].id,blobs[i].x,blobs[i].y+45);
    }
  }
}
