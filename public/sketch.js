var socket;
var blobs = [];
var prevblobs = [];
var omega = 0.1;
var fr = 30;
var blob;
var p;
var div;
var nameInput;
var started = false;
var lerpValue = 0.5;
var indicator = true;

function setup() {
  frameRate(fr);
  createCanvas(1000,800);

  p = document.getElementById('peopleCounter');
  div = document.getElementById('inputDiv');
  nameInput = createInput('').parent(inputHolder).id('nameInput');
  document.getElementById('nameInput').placeholder = "Name";
  createSpan("").parent(inputHolder).class('bar');

  nameInput.changed(startOfGame);

  socket = io.connect('https://bloby-game.herokuapp.com/');

	socket.on('id', getId);
  socket.on('count', updateCount);
  socket.on('heartbeat', heartbeat);

	function getId(data) {
		blob = new Blob(0,0,random(360),data);
	}
  function updateCount(data) {
    p.innerHTML = "Počet pripojených ľudí : " + data;
  }
  function heartbeat(data) {
    prevblobs = blobs;
    data = JSON.parse(data);
    blobs = data;
    fill(255,0,0);
    ellipse(20,20,10,10);
  }
}

function lerpUpdate(){
  for (var i = 0; i < blobs.length; i++) {
    if (prevblobs[i]) {
      var posX = lerp(prevblobs[i].pos.x,blobs[i].pos.x, lerpValue);
      var posY = lerp(prevblobs[i].pos.y,blobs[i].pos.y, lerpValue);
      var f = lerp(prevblobs[i].f,blobs[i].f, lerpValue);
      var t = lerp(prevblobs[i].theta,blobs[i].theta, lerpValue);
      prevblobs[i] = blobs[i];
      prevblobs[i].pos.x = posX;
      prevblobs[i].pos.y = posY;
      prevblobs[i].f = f;
      prevblobs[i].theta = t;
    }else {
      prevblobs[i] = blobs[i];
    }
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
  if (indicator) {
    fill(0,0,255);
    ellipse(40,20,10,10);
    indicator = false;
  }else {
    indicator = true;
  }

  noFill();
  strokeWeight(10);
  stroke(100,200,0);
  ellipse(500,400,700,700);
  strokeWeight(1);
  noStroke();

  lerpUpdate();

  for (var i = 0; i < prevblobs.length; i++) {

      push();
      translate(prevblobs[i].pos.x,prevblobs[i].pos.y);
      rotate(prevblobs[i].theta);
      stroke(0,0,255);
      fill(0,150,255);
      ellipse(0, 0, 60, 60);
      rect(33, -5, prevblobs[i].f + 10, 10);
      pop();
      fill(0);
      textAlign(CENTER,CENTER);
      textSize(30);
      text(prevblobs[i].score,prevblobs[i].pos.x,prevblobs[i].pos.y);
      textSize(15);
      text(prevblobs[i].name,prevblobs[i].pos.x,prevblobs[i].pos.y+40);

  }
}
