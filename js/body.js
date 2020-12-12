function Body(ax,ay,dx,dy,density,grpobjs)
{

  this.grpobj = grpobjs.body;
  this.acc = grpobjs.acc;
  this.spd = grpobjs.spd;

  this.inix = this.grpobj.x();
  this.iniy = this.grpobj.y();
  this._ax=ax;
  this._ay=ay;
  this.ax=0;
  this.ay=0;
  this.dx=dx;
  this.dy=dy;
  this._dx=dx;
  this._dy=dy;

  this.density = density;

  this.radius = this.grpobj.radius();

  this.w = this.grpobj.getStage().getWidth();
  this.h = this.grpobj.getStage().getHeight();

  this.getMass = function()
  {
    var m= this.grpobj.radius() *this.grpobj.radius();
    if(density)
      m *= density;
    return m;
  }


  this.getMomentum = function()
  {
    return this.getMass() * Math.sqrt(this.dx*this.dx + this.dy*this.dy);
  }

  this.x=function()
  {
    return this.grpobj.x();

  }

  this.y=function()
  {
    return this.grpobj.y();
  }

  this.getRadius = function ()
  {
    return this.radius;
  }

  this.resetInitPos = function()
  {
    this.inix = this.grpobj.x();
    this.iniy = this.grpobj.y();
  }


  this.reset = function()
  {
    this.grpobj.x(this.inix);
    this.grpobj.y(this.iniy);
    this.ax=0;
    this.ay=0;
    this.dx=this._dx;
    this.dy=this._dy;
  }

  this.move = function()
  {
    // Accelerazione
    this.dx += this.ax + this._ax;
    this.dy += this.ay + this._ay;

    // Rimbalzo
    if(this.x() + this.dx > this.w - this.radius || this.x() + this.dx < this.radius) {
        this.dx = - ELAST_COEFF * this.dx;
    }

    if(this.y() + this.dy > this.h - this.radius || this.y() + this.dy < this.radius) {
        this.dy = - ELAST_COEFF * this.dy;
    }

    // Spostamento
    var _x = this.x() + this.dx;
    var _y = this.y() + this.dy;

    this.grpobj.x(_x);
    this.grpobj.y(_y);

    this.setVectors();
  }

  this.prepareForInteract = function()
  {
    this.ax=0;
    this.ay=0;
  }

  this.setVectors = function()
  {
    var f = 10;
    var x = this.grpobj.x();
    var y = this.grpobj.y();
    this.spd.points([x,y, x+this.dx*f, y+this.dy*f]);
    this.acc.points([x,y, x+this.ax*f*10, y+this.ay*f*10]);

  }
}



function collisionManagement(objects,onCollision)
{
    for(var i=0;i<objects.length;i++)
        for(var j=0;j<objects.length;j++)
        if(i!=j && i>=j)
        {
            var o1 = objects[i];
            var o2 = objects[j];

            var x = o1.x()-o2.x();
            var y = o1.y()-o2.y();

            if(x*x+y*y< (o1.getRadius()+o2.getRadius())*(o1.getRadius()+o2.getRadius()) )
            {
            // Collisione
            //animationOn = false;

            if(typeof onCollision === "function")
                onCollision();

            //var p1 = o1.getMomentum();
            //var p2 = o2.getMomentum();

            }
        }
}

function interaction(bodies)
{
    for(var i1=0;i1<bodies.length;i1++)
        for(var i2=0;i2<bodies.length;i2++)
        if(i1>i2)
        {
            interact(bodies[i1], bodies[i2]);
        }

}

function interact(o1,o2)
{

    var x = o1.x()-o2.x();
    var y = o1.y()-o2.y();

    // Angolo del vettore f
    var alpha = Math.atan(Math.abs(y/x));

    var f = 0.01 / Math.sqrt(x*x + y*y);

    // componenti di f lungo gli assi
    var fx1 = f * Math.cos(alpha) * o2.getMass();
    var fy1 = f * Math.sin(alpha) * o2.getMass();

    var fx2 = f * Math.cos(alpha) * o1.getMass();
    var fy2 = f * Math.sin(alpha) * o1.getMass();

    if(x>0) fx1 = - fx1; o1.ax += fx1;
    if(y>0) fy1 = - fy1; o1.ay += fy1;

    if(x<0) fx2= - fx2; o2.ax += fx2;
    if(y<0) fy2= - fy2; o2.ay += fy2;
}