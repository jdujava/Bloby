/* eslint-disable no-use-before-define */
var socket
var blobs = []
var prevblobs = []
var hooks = []
var pillars = []
var omega = 0.1
var blob
// var p
var div
var nameInput
var started = false
var lerpValue = 0.5
var coolRectQ = 75
var coolRectW = 75
var coolRectE = 75
var ping = 0
var fps = 0
var startTime = 0
var windowScale = 1
var chatFocus = false

function setup () {
  createCanvas(1000, 800)
  textAlign(CENTER, CENTER)

  // p = document.getElementById('peopleCounter')
  div = document.getElementById('inputDiv')
  nameInput = createInput('').parent(inputHolder).id('nameInput')
  document.getElementById('nameInput').placeholder = 'Name'
  createSpan('').parent(inputHolder).class('bar')

  nameInput.changed(startOfGame)

  socket = io.connect('https://tehblobs.herokuapp.com/')
  //socket = io.connect('http://localhost:5000/')

  socket.on('id', getId)
  socket.on('scale', setScale)
  socket.on('getPing', getPing)
  socket.on('heartbeat', heartbeat)
  socket.on('chat message', function (data) {
    $('#messages').append($('<li>').text(data.name + ' : ').append($('<span>').text(data.msg)))
    $('#messages').animate({ scrollTop: 1000000 }, 'slow')
  })

  $('form').submit(function () {
    if ($('#m').val()) {
      var data = {
        msg: $('#m').val(),
        name: blob.name
      }
      socket.emit('chat message', data)
      $('#m').val('')
    }
    $('#m').blur()
    chatFocus = false
    return false
  })

  $('#defaultCanvas0').mousedown(function () {
    if (started && !chatFocus) {
      socket.emit('press', blob.id)
    }
  })
  $('#m').focusin(function () {
    chatFocus = true
  })
  $('#m').focusout(function () {
    chatFocus = false
  })
  $(document).keypress(function (e) {
    if (started && e.which === 13 && !chatFocus) {
      console.log('saddsa')
      $('#m').focus()
    }
  })

  function getId (id) {
    blob = {
      pos: {x: 0, y: 0},
      theta: random(360),
      id: id
    }
  }
  // function updateCount(data) {
  //   p.innerHTML = "Počet pripojených ľudí : " + data;
  // }
  function setScale (scale) {
    windowScale = scale
  }
  function getPing () {
    ping = Math.floor(new Date().getTime() - startTime)
  }
  function heartbeat (data) {
    data = JSON.parse(data)
    prevblobs = blobs
    blobs = data.blobs
    hooks = data.hooks
    pillars = data.pillars
  }

  setInterval(function () {
    fps = Math.floor(frameRate())
    startTime = new Date().getTime()
    socket.emit('plsRespond')
  }, 1000)
}

function lerpUpdate () {
  for (var i = 0; i < blobs.length; i++) {
    if (prevblobs[i]) {
      var posX = lerp(prevblobs[i].pos.x, blobs[i].pos.x, lerpValue)
      var posY = lerp(prevblobs[i].pos.y, blobs[i].pos.y, lerpValue)
      var f = lerp(prevblobs[i].f, blobs[i].f, lerpValue)
      var t = lerp(prevblobs[i].theta, blobs[i].theta, lerpValue)
      prevblobs[i] = blobs[i]
      prevblobs[i].pos.x = posX
      prevblobs[i].pos.y = posY
      prevblobs[i].f = f
      prevblobs[i].theta = t
    } else {
      prevblobs[i] = blobs[i]
    }
  }
}

function startOfGame () {
  started = true
  var name = nameInput.value()
  blob.name = name
  var blobData = {
    x: blob.pos.x,
    y: blob.pos.y,
    t: blob.theta,
    id: blob.id,
    name: blob.name
  }
  socket.emit('start', blobData)
  div.classList.add('hidden')
  setTimeout(function () {
    removeElements()
  }, 1000)
}

function byID (id) {
  for (var i = 0; i < blobs.length; i++) {
    if (id === blobs[i].id) {
      return blobs[i]
    }
  }
}

function constrainMousePosition (min, max) {
  var mpos = createVector(mouseX, mouseY)
  var bpos = byID(blob.id).pos
  bpos = createVector(bpos.x, bpos.y)
  mpos.sub(bpos)
  mpos.setMag(constrain(mpos.mag(), min, max))
  var point = p5.Vector.add(bpos, mpos)
  return point
}

function keyPressed () {
  if (started && key === 'Q' && coolRectQ >= 75 && !chatFocus) {
    var point = constrainMousePosition(90 * windowScale, 150 * windowScale)
    var data = {
      id: blob.id,
      x: point.x,
      y: point.y
    }
    socket.emit('hook', data)
    coolRectQ = 0
    var cooldownQ = setInterval(function () {
      coolRectQ += 0.5357
      if (coolRectQ >= 75) {
        clearInterval(cooldownQ)
      }
    }, 50)
  }
  if (started && key === 'W' && coolRectW >= 75 && !chatFocus) {
    var point = constrainMousePosition(30 * windowScale, 150 * windowScale)
    var data = {
      id: blob.id,
      x: point.x,
      y: point.y
    }
    socket.emit('flash', data)
    coolRectW = 0
    var cooldownW = setInterval(function () {
      coolRectW += 0.5357
      if (coolRectW >= 75) {
        clearInterval(cooldownW)
      }
    }, 50)
  }
  if (started && key === 'E' && coolRectE >= 75 && !chatFocus) {
    var point = constrainMousePosition(5 * windowScale, 150 * windowScale)
    var data = {
      id: blob.id,
      x: point.x,
      y: point.y
    }
    socket.emit('pillar', data)
    coolRectE = 0
    var cooldownE = setInterval(function () {
      coolRectE += 0.5357
      if (coolRectE >= 75) {
        clearInterval(cooldownE)
      }
    }, 50)
  }
}

function keyReleased () {
  if (started && key === 'Q' && !chatFocus) {
  	socket.emit('left', blob.id)
  }
}

function touchEnded () {
  if (started && !chatFocus) {
    socket.emit('release', blob.id)
  }
}

function draw () {
  background(255)
  noStroke()
  fill(0)
  textSize(10)
  text('FPS : ' + fps, 940, 20)
  text('Ping : ' + ping, 940, 40)

  noFill()
  strokeWeight(10)
  stroke(100, 200, 0)
  ellipse(500, 400, 700, 700)
  strokeWeight(1)
  noStroke()

  lerpUpdate()

  stroke(25)
  fill(60)
  for (var n = 0; n < pillars.length; n++) {
    ellipse(pillars[n].pos.x, pillars[n].pos.y, 60 * windowScale, 60 * windowScale)
  }

  noStroke()
  strokeWeight(1)
  for (var i = 0; i < prevblobs.length; i++) {
    push()
    translate(prevblobs[i].pos.x, prevblobs[i].pos.y)
    rotate(prevblobs[i].theta)
    stroke(0, 0, 255)
    fill(0, 150, 255)
    if (prevblobs[i].id === blob.id) {
      fill(255, 50, 0)
    }
    ellipse(0, 0, 60 * windowScale, 60 * windowScale)
    rect(33 * windowScale, -5 * windowScale, prevblobs[i].f * windowScale + 10 * windowScale, 10 * windowScale)
    pop()
    fill(0)
    textSize(30 * windowScale)
    text(prevblobs[i].score, prevblobs[i].pos.x, prevblobs[i].pos.y)
    textSize(15 * windowScale)
    text(prevblobs[i].name, prevblobs[i].pos.x, prevblobs[i].pos.y + 40 * windowScale)
  }

  for (n = 0; n < hooks.length; n++) {
    noStroke()
    fill(0, 255, 0)
    ellipse(hooks[n].joint.x, hooks[n].joint.y, 15 * windowScale, 15 * windowScale)
    fill(255, 0, 0)
    for (var m = 0; m < hooks[n].spring.length; m++) {
      ellipse(hooks[n].spring[m].pos.x, hooks[n].spring[m].pos.y, 10 * windowScale, 10 * windowScale)
    }
  }

  fill(0, 200, 255)
  rect(875, 262.5, 75, coolRectQ)
  rect(875, 362.5, 75, coolRectW)
  rect(875, 462.5, 75, coolRectE)
  textSize(50)
  fill(0)
  text('Q', 912.5, 300)
  text('W', 912.5, 400)
  text('E', 912.5, 500)
  stroke(0, 50, 150)
  strokeWeight(3)
  noFill()
  rect(875, 262.5, 75, 75)
  rect(875, 362.5, 75, 75)
  rect(875, 462.5, 75, 75)
}
