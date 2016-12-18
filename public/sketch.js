var socket;
var blobs = [];
var prevblobs = [];
var hooks = [];
var omega = 0.1;
var blob;
var p;
var div;
var nameInput;
var started = false;
var lerpValue = 0.5;
var coolRectQ = 75;
var coolRectW = 75;
var ping = 0;

function setup() {
  createCanvas(1000,800);
  textAlign(CENTER,CENTER);

  p = document.getElementById('peopleCounter');
  div = document.getElementById('inputDiv');
  nameInput = createInput('').parent(inputHolder).id('nameInput');
  document.getElementById('nameInput').placeholder = "Name";
  createSpan("").parent(inputHolder).class('bar');

  nameInput.changed(startOfGame);

  socket = io.connect('http://localhost:5000/');

	socket.on('id', getId);
  socket.on('count', updateCount);
  socket.on('heartbeat', heartbeat);

	function getId(id) {
		blob = new Blob(0,0,random(360),id);
	}
  function updateCount(data) {
    p.innerHTML = "Počet pripojených ľudí : " + data;
  }
  function heartbeat(data) {
    prevblobs = blobs;
    blobsData = JSON.parse(data.blobs);
    hooksData = JSON.parse(data.hooks);
    blobs = blobsData;
    hooks = hooksData;
    ping = new Date().getTime() - data.t;
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

function byID(id){
  for (var i = 0; i < blobs.length; i++) {
    if(id === blobs[i].id){
      return blobs[i];
    }
  }
}

function constrainMousePosition(min,max){
  var mpos = createVector(mouseX,mouseY);
  var bpos = byID(blob.id).pos;
  bpos = createVector(bpos.x,bpos.y);
  mpos.sub(bpos);
  mpos.setMag(constrain(mpos.mag(),min,max));
  var point = p5.Vector.add(bpos,mpos);
  return point;
}

function keyPressed() {
  if (started && key === 'Q' && coolRectQ >= 75) {
    var point = constrainMousePosition(90,150);
    var data = {
      id: blob.id,
      x : point.x,
      y : point.y
    }
    socket.emit('hook', data);
    coolRectQ = 0;
    var cooldownQ = setInterval(function () {
      coolRectQ += 0.5357;
      if (coolRectQ >= 75) {
        clearInterval(cooldownQ);
      }
    },50);
  }
  if (started && key === 'W' && coolRectW >= 75) {
    var point = constrainMousePosition(50,100);
    var data = {
      id: blob.id,
      x : point.x,
      y : point.y
    }
    socket.emit('flash', data);
    coolRectW = 0;
    var cooldownW = setInterval(function () {
      coolRectW += 0.5357;
      if (coolRectW >= 75) {
        clearInterval(cooldownW);
      }
    },50);
  }
  if (started && key === ' ') {
    socket.emit('press', blob.id);
  }

}

function touchStarted() {
  if (started) {
    socket.emit('press', blob.id);
  }
}

function keyReleased() {
  if (started && key === 'Q') {
  	socket.emit('left', blob.id);
  }
  if (started && key === ' ') {
  	socket.emit('release', blob.id);
  }
}

function touchEnded() {
  if (started) {
    socket.emit('release', blob.id);
  }
}

function draw() {
  background(255);
  noStroke();
  fill(0);
  textSize(10);
  text("FPS : " + Math.floor(frameRate()),20,20);
  text("Ping : " + ping,20,40);

  noFill();
  strokeWeight(10);
  stroke(100,200,0);
  ellipse(500,400,700,700);
  strokeWeight(1);
  noStroke();

  lerpUpdate();

  for (var i = 0; i < prevblobs.length; i++) {

    noStroke();
    strokeWeight(1);

      push();
      translate(prevblobs[i].pos.x,prevblobs[i].pos.y);
      rotate(prevblobs[i].theta);
      stroke(0,0,255);
      fill(0,150,255);
      ellipse(0, 0, 60, 60);
      rect(33, -5, prevblobs[i].f + 10, 10);
      pop();
      fill(0);
      textSize(30);
      text(prevblobs[i].score,prevblobs[i].pos.x,prevblobs[i].pos.y);
      textSize(15);
      text(prevblobs[i].name,prevblobs[i].pos.x,prevblobs[i].pos.y+40);

      for (var n = 0; n < hooks.length; n++) {
        noStroke();
        fill(0,255,0);
        ellipse(hooks[n].joint.x, hooks[n].joint.y, 15, 15);
        fill(255,0,0);
        for (var m = 0; m < hooks[n].spring.length; m++) {
          ellipse(hooks[n].spring[m].pos.x, hooks[n].spring[m].pos.y, 10, 10);
        }
      }

      fill(0,200,255);
      rect(775,50,75,coolRectQ);
      rect(875,50,75,coolRectW);
      textSize(50);
      fill(0);
      text("Q",812.5,87.5);
      text("W",912.5,87.5);
      stroke(0,50,150);
      strokeWeight(3);
      noFill();
      rect(775,50,75,75);
      rect(875,50,75,75);
  }
}
