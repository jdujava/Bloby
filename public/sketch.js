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

	socket.on('id', getId);
  socket.on('count', updateCount);
  socket.on('heartbeat', heartbeat);

	function getId(data) {
		blob = new Blob(200,200,random(360),data);

		var blobData = {
			x : blob.pos.x,
			y : blob.pos.y,
			t : blob.theta,
			id : blob.id
		}
		socket.emit('start',blobData);

    console.log(blob);
	}
  function updateCount(data) {
    p.innerHTML = "Počet pripojených ľudí : " + data;
  }
  function heartbeat(data) {
    blobs = data;
  }
}

function keyPressed() {
  blob.charge();
	socket.emit('press', blob.id);
}

function touchStarted() {
  blob.charge();
	socket.emit('press', blob.id);
}

function keyReleased() {
  blob.release();
	socket.emit('release', blob.id);
}

function touchEnded() {
  blob.release();
	socket.emit('release', blob.id);
}

function draw() {
  background(51);



  for (var i = 0; i < blobs.length; i++) {

      push();
      translate(blobs[i].pos.x,blobs[i].pos.y);
      rotate(blobs[i].theta);
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
