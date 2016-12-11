var socket;
var blobs = [];
var omega = 0.1;
var fr = 30;
var blob;
var p;
var div;
var nameInput;
var started = false;

function setup() {
  frameRate(fr);
  createCanvas(1000,800);

  p = document.getElementById('peopleCounter');
  div = document.getElementById('inputDiv');
  nameInput = createInput('Name').parent(inputHolder).class('nameInput');
  createSpan("").parent(inputHolder).class('bar');

  nameInput.changed(startOfGame);

  socket = io.connect('https://bloby-game.herokuapp.com/');

	socket.on('id', getId);
  socket.on('count', updateCount);
  socket.on('heartbeat', heartbeat);

	function getId(data) {
		blob = new Blob(400 + Math.random()*200,300 + Math.random()*200,random(360),data);
	}
  function updateCount(data) {
    p.innerHTML = "Počet pripojených ľudí : " + data;
  }
  function heartbeat(data) {
    blobs = data;
  }
}

function startOfGame () {
  started = true;
  var name = nameInput.value();
  blob.name = name;
  var blobData = {
    x : blob.pos.x,
    y : blob.pos.y,
    t : blob.theta,
    id : blob.id,
    name : blob.name
  }
  socket.emit('start',blobData);
  div.classList.add("hidden");
  setTimeout(function () {
    removeElements();
  },1000);
}

function keyPressed() {
  if (started && key === ' ') {
    blob.charge();
    socket.emit('press', blob.id);
  }
}

function touchStarted() {
  if (started) {
    blob.charge();
    socket.emit('press', blob.id);
  }
}

function keyReleased() {
  if (started && key === ' ') {
    blob.release();
  	socket.emit('release', blob.id);
  }
}

function touchEnded() {
  if (started) {
    blob.release();
    socket.emit('release', blob.id);
  }
}

function draw() {
  background(255);
  noFill();
  strokeWeight(10);
  stroke(100,200,0);
  ellipse(500,400,700,700);
  strokeWeight(1);
  noStroke();

  for (var i = 0; i < blobs.length; i++) {

      push();
      translate(blobs[i].pos.x,blobs[i].pos.y);
      rotate(blobs[i].theta);
      stroke(0,0,255);
      fill(0,150,255);
      ellipse(0, 0, 60, 60);
      rect(33, -5, blobs[i].f + 10, 10);
      pop();
      fill(0);
      textAlign(CENTER,CENTER);
      textSize(30);
      text(blobs[i].score,blobs[i].pos.x,blobs[i].pos.y);
      textSize(15);
      text(blobs[i].name,blobs[i].pos.x,blobs[i].pos.y+40);

  }
}
