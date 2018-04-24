function Body(x,y,ax,ay,dx,dy,color,radius)
{
  this.x=x;
  this.y=y;
  this.ax=ax;
  this.ay=ay;
  this.dx=dx;
  this.dy=dy;
  this.color=color;
  this.radius=radius;

  this.getMass = function()
  {
    return this.radius*this.radius;
  }
}

var objects = [];
objects.push(new Body(100,150,0, 0.1,1,0,"#0095DD",10));
objects.push(new Body(200,200,0, 0.1,5,0,"#DD9500",10));


function interact(o1,o2)
{

  var x = o1.x-o2.x;
  var y = o1.y-o2.y;

  // Angolo del vettore f
  var alpha = Math.atan(y/x);


  var f = 0.1 / Math.sqrt(x*x + y*y);

  // componenti di f lungo gli assi
  var fx1 = f * Math.cos(alpha) * o2.getMass();
  var fy1 = f * Math.sin(alpha) * o2.getMass();

  var fx2 = f * Math.cos(alpha) * o1.getMass();
  var fy2 = f * Math.sin(alpha) * o1.getMass();

  o1.ax = fx1;
  o1.ay = fy1;

  o2.ax = - fx2;
  o2.ay = - fy2;
}

interact(objects[0], objects[1]);

console.log(objects[0]);
console.log(objects[1]);
