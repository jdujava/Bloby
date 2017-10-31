
var express = require('express')
var uuid = require('uuid')
var path = require('path')

var app = express()

app.set('port', (process.env.PORT || 5000))
var server = app.listen(process.env.PORT || 5000)

app.use(express.static(path.join(__dirname, 'public')))

var socket = require('socket.io')
var io = socket(server)

var blobs = []
var hooks = []
var pillars = []
// var peopleCounter = 0
var omega = 0.06
var windowScale = 1
var dt = 3

var add = function (a, b) { return { x: (a.x + b.x), y: (a.y + b.y) } }
var sub = function (a, b) { return { x: (a.x - b.x), y: (a.y - b.y) } }
var mult = function (a, b) { return { x: (a.x * b), y: (a.y * b) } }
var mag = function (a) { return (Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2))) }

function byID (id) {
  for (var i = 0; i < blobs.length; i++) {
    if (id === blobs[i].id) {
      return blobs[i]
    }
  }
}
function newLocation () {
  while (true) {
    var bool = true
    var newPos = { x: (350 + Math.random() * 300), y: (250 + Math.random() * 300) }
    for (var i = 0; i < blobs.length; i++) {
      if (mag(sub(blobs[i].pos, newPos)) < 80 * windowScale) bool = false
    }
    if (bool) {
      return newPos
    }
  }
}
function scaleWindow () {
  windowScale = 1.1 - 0.04 * blobs.length
}

// Number.prototype.fixed = function (n) { n = n || 3; return parseFloat(this.toFixed(n)) }

function Rope (x, y, id) {
  this.spring = []
  this.dist = 30 * windowScale
  this.id = id
  this.joint = {x: x, y: y}
  this.t = 0
  this.active = false
}
Rope.prototype.run = function () {
  var m, n
  if (this.spring.length === 1) {
    m = this.joint
    n = byID(this.id).pos
    this.spring[0].run(m, n)
  } else {
    for (var i = 0; i < this.spring.length; i++) {
      var a = this.spring[i]
      if (i === 0) {
        m = this.joint
        n = this.spring[i + 1].pos
      } else if (i === this.spring.length - 1) {
        m = this.spring[i - 1].pos
        n = byID(this.id).pos
      } else {
        m = this.spring[i - 1].pos
        n = this.spring[i + 1].pos
      }
      a.run(m, n)
    }
  }
  this.t += 0.02
  if (this.t > 3) {
    hooks.splice(0, 1)
  }
  if (this.spring[this.spring.length - 1]) {
    this.pull(byID(this.id))
  }
}

Rope.prototype.addSpring = function () {
  var diff = sub(this.joint, byID(this.id).pos)
  var dist = mag(diff)
  var count = Math.max(Math.ceil(dist / this.dist), 3)
  diff = mult(diff, 1 / count)
  for (var i = 1; i < count - 1; i++) {
    var x = byID(this.id).pos.x + i * diff.x
    var y = byID(this.id).pos.y + i * diff.y
    this.spring.push(new SpringNode(x, y))
  }
  this.active = true
}
Rope.prototype.pull = function (blob) {
  var a = sub(this.spring[this.spring.length - 1].pos, blob.pos)
  var dist = mag(a)
  if (dist > 10 * windowScale) {
    a = mult(a, 1 / mag(a))
    dist -= 10 * windowScale
    var newMag = dist * 0.006 * dt
    a = mult(a, newMag)
    blob.acc = add(blob.acc, a)
  }
}


function SpringNode (_x, _y) {
  this.stiffness = 0.8
  this.damping = 0.65

  this.pos = {x: _x, y: _y}
  this.vel = {x: 0, y: 0}
  this.acc = {x: 0, y: 0}
  this.radius = 5 * windowScale
}

SpringNode.prototype.run = function (prev1, prev2) {
  this.update(prev1.x, prev1.y, prev2.x, prev2.y)
  // this.display(prev1.x,prev1.y);
}

SpringNode.prototype.update = function (x1, y1, x2, y2) {
  var target1 = {x: x1, y: y1}
  var target2 = {x: x2, y: y2}
  this.applyForce(target1)
  this.applyForce(target2)
  this.vel = mult(add(this.vel, this.acc), this.damping)
  this.pos = add(this.pos, this.vel)
  this.acc = mult(this.acc, 0)
}

SpringNode.prototype.applyForce = function (t) {
  var a = sub(t, this.pos)
  var dist = mag(a)
  if (dist > 10 * windowScale) {
    a = mult(a, 1 / mag(a))
    dist -= 10 * windowScale
    var newMag = dist * this.stiffness * windowScale * dt
    a = mult(a, newMag)
    this.acc = add(this.acc, a)
  }
}

function Pillar (_x, _y, id) {
  this.pos = {x: _x, y: _y}
  this.id = id
  this.t = 0
}

Pillar.prototype.run = function () {
  this.t += 0.02
  if (this.t > 3) {
    pillars.splice(0, 1)
  }
}

function Blob (_x, _y, t, id, n) {
  this.pos = {x: _x, y: _y}
  this.vel = {x: 0, y: 0}
  this.acc = {x: 0, y: 0}
  this.theta = t
  this.omega = omega
  this.r = 30
  this.f = 0
  this.ch = 0
  this.rotating = true
  this.id = id
  this.name = n
  this.score = 0
  this.touch
  this.hooked = false
  this.flashed = false
  this.pillared = false
  this.hookID
}

Blob.prototype.run = function () {
  this.borders()
  this.update()
}

Blob.prototype.applyForce = function (f) {
  this.acc = add(this.acc, f)
}

Blob.prototype.charge = function () {
  this.ch = 3.125
  this.omega *= -1
  this.rotating = false
}

Blob.prototype.release = function () {
  this.ch = -20
  var x = Math.cos(this.theta) * Math.pow(this.f / 30, 2) * windowScale
  var y = Math.sin(this.theta) * Math.pow(this.f / 30, 2) * windowScale
  var f = {x: x, y: y}
  this.applyForce(f)
  this.rotating = true
}

Blob.prototype.update = function () {
  this.vel = add(this.vel, this.acc)
  this.pos = add(this.pos, mult(this.vel,dt))
  this.acc = mult(this.acc, 0)
  if (this.rotating) {
    this.theta += this.omega*dt
  }
  this.f += this.ch*dt
  this.f = Math.max(0, Math.min(60, this.f))
}

Blob.prototype.throwHook = function (id, x, y) {
  var hook = new Rope(x, y, id)
  hook.addSpring()
  hooks.push(hook)
  this.hooked = true
}

Blob.prototype.flash = function (_x, _y) {
  var newPos = { x: _x, y: _y }
  for (var i = 0; i < blobs.length; i++) {
    var diff = sub(newPos, blobs[i].pos)
    if (mag(diff) < 62 * windowScale) {
      var len = 62 * windowScale - mag(diff)
      diff = mult(diff, len / mag(diff))
      newPos = add(newPos, diff)
      break
    }
  }
  this.pos.x = newPos.x
  this.pos.y = newPos.y
  this.flashed = true
}

Blob.prototype.pillar = function (x, y, id) {
  var pillar = new Pillar(x, y, id)
  pillars.push(pillar)
  this.pillared = true
}

Blob.prototype.borders = function () {
  if (mag(sub(this.pos, {x: 500, y: 400})) > 320) {
    this.score--
    if (this.hooked) {
      this.hooked = false
      for (var i = 0; i < hooks.length; i++) {
        if (hooks[i].id === this.id) {
          hooks.splice(i, 1)
        }
      }
    }
    this.vel = mult(this.vel, 0)
    this.ch = -20 * windowScale
    this.f = 0
    this.rotating = true
    if (this.touch) {
      if (byID(this.touch)) {
        byID(this.touch).score ++
      }
      this.touch = undefined
    }
    var newPos = newLocation()
    this.pos.x = newPos.x
    this.pos.y = newPos.y
  }
}

Blob.prototype.collision = function (other) {
  var diff = sub(this.pos, other.pos)
  var dist = mag(diff)
  if (dist <= this.r * 2 * windowScale) {
    var len = (61 * windowScale - dist) * 0.5
    diff = mult(diff, len / dist)
    this.pos = add(this.pos, diff)
    other.pos = sub(other.pos, diff)
    diff = mult(diff, 1 / len)
    var p = this.vel.x * diff.x + this.vel.y * diff.y - other.vel.x * diff.x - other.vel.y * diff.y
    var f1 = mult(diff, -p)
    var f2 = mult(diff, p)
    this.applyForce(f1)
    other.applyForce(f2)
    this.touch = other.id
    other.touch = this.id
  }
}

Blob.prototype.hitPillar = function (pillar) {
  var diff = sub(this.pos, pillar.pos)
  var dist = mag(diff)
  if (dist < this.r * 2 * windowScale) {
    var len = 61 * windowScale - dist
    diff = mult(diff, len / dist)
    this.pos = add(this.pos, diff)
    diff = mult(diff, 1 / len)
    var p = 2 * this.vel.x * diff.x + 2 * this.vel.y * diff.y
    var f1 = mult(diff, -p)
    this.applyForce(f1)
    if (this.id !== pillar.id) this.touch = pillar.id
  }
}

setInterval(heartbeat, 40)

function heartbeat () {
  physics()
  var data = {
    blobs: blobs,
    hooks: hooks,
    pillars: pillars
  }
  data = JSON.stringify(data)
  io.sockets.emit('heartbeat', data)
}
function physics () {
  for (var i = 0; i < pillars.length; i++) {
    pillars[i].run()
  }
  for (i = 0; i < blobs.length - 1; i++) {
    for (var j = i + 1; j < blobs.length; j++) {
      blobs[i].collision(blobs[j])
    }
  }
  for (i = 0; i < hooks.length; i++) {
    if (hooks[i].active) {
      hooks[i].run()
    }
  }
  for (i = 0; i < blobs.length; i++) {
    for (var k = 0; k < pillars.length; k++) {
      blobs[i].hitPillar(pillars[k])
    }
    blobs[i].run()
  }
}

io.sockets.on('connection', newConnection)

function newConnection (socket) {
  // peopleCounter++

  var id = uuid()
  socket.emit('id', id)

  socket.on('disconnect', disconnect)
  socket.on('start', start)
  socket.on('press', press)
  socket.on('release', release)
  socket.on('hook', hook)
  socket.on('left', left)
  socket.on('flash', flash)
  socket.on('pillar', pillar)
  socket.on('plsRespond', function () {
    socket.emit('getPing')
  })
  socket.on('chat message', function (msg) {
    io.emit('chat message', msg)
  })

  function disconnect () {
    for (var i = 0; i < blobs.length; i++) {
      if (id === blobs[i].id) {
        blobs.splice(i, 1)
        scaleWindow()
        io.sockets.emit('scale', windowScale)
      }
    }
    for (i = 0; i < hooks.length; i++) {
      if (hooks[i].id === id) {
        hooks.splice(i, 1)
      }
    }
    console.log(id)
    // peopleCounter--
    scaleWindow()
    io.sockets.emit('scale', windowScale)
    // io.sockets.emit("count",peopleCounter);
  }
  function start (data) {
    var newPos = newLocation()
    var blob = new Blob(newPos.x, newPos.y, data.t, data.id, data.name)
    blobs.push(blob)
    scaleWindow()
    io.sockets.emit('scale', windowScale)
  }
  function press (id) {
    if (byID(id)) {
      byID(id).charge()
    }
  }
  function release (id) {
    if (byID(id)) {
      byID(id).release()
    }
  }
  function hook (data) {
    if (!byID(data.id).hooked) {
      byID(data.id).throwHook(data.id, data.x, data.y)
      setTimeout(function () {
        if (byID(id)) {
          byID(id).hooked = false
        }
      }, 7000)
    }
  }
  function left (id) {
    for (var i = 0; i < hooks.length; i++) {
      if (hooks[i].id === id) {
        hooks.splice(i, 1)
      }
    }
  }
  function flash (data) {
    if (!byID(data.id).flashed) {
      byID(data.id).flash(data.x, data.y)
      setTimeout(function () {
        if (byID(id)) {
          byID(id).flashed = false
        }
      }, 7000)
    }
  }
  function pillar (data) {
    if (!byID(data.id).pillared) {
      byID(data.id).pillar(data.x, data.y, data.id)
      setTimeout(function () {
        if (byID(id)) {
          byID(id).pillared = false
        }
      }, 7000)
    }
  }
}
