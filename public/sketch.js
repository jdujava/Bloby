var socket;
var blobs = [];
var omega = 0.05;

function setup() {
  createCanvas(1000,800);

  var p = document.getElementById('peopleCounter');

  socket = io.connect('http://localhost:5000/');
  socket.on('count', updateCount);

  function updateCount(data) {
    p.innerHTML = "Počet pripojených ľudí : " + data;
  }
}

function mousePressed() {
  var b = new Blob(mouseX,mouseY,random(360),30);
  blobs.push(b);

  console.log("lol");

  //socket.emit('newBlob', b);

}

function keyPressed() {
  for (var i = 0; i < blobs.length; i++) {
    blobs[i].ch = 2;
    blobs[i].omega *= -1;
    blobs[i].rotating = false;
  }
}

function keyReleased() {
  for (var i = 0; i < blobs.length; i++) {
    blobs[i].ch = -20;
    var x = cos(blobs[i].theta)*pow(blobs[i].f/50,2);
    var y = sin(blobs[i].theta)*pow(blobs[i].f/50,2);
    var f = createVector(x,y);
    blobs[i].applyForce(f);
    blobs[i].rotating = true;
  }
}

function draw() {
  background(51);
  for (var i = 0; i < blobs.length; i++) {
    blobs[i].run();
  }
}
