var Vector = function () {};

Vector.prototype.add = function(a,b) { return { x:(a.x+b.x), y:(a.y+b.y) }; };
Vector.prototype.sub = function(a,b) { return { x:(a.x-b.x), y:(a.y-b.y) }; };
Vector.prototype.mult = function(a,b) { return { x: (a.x*b), y:(a.y*b) }; };
Vector.prototype.mag = function(a) {return (Math.sqrt(Math.pow(a.x,2)+Math.pow(a.y,2)))};

module.exports = new Vector();
