function Body(conf) {

  this._x = conf.x;
  this._y = conf.y;
  this.x = conf.x;
  this.y = conf.y;
  this._ax=conf.ax;
  this._ay= conf.ay;
  this.ax=0;
  this.ay=0;
  this._dx=conf.dx;
  this._dy=conf.dy;
  this.dx=this._dx;
  this.dy=this._dy;

  this.density = conf.density;
  this.index = conf.index;

  this.radius = conf.radius;

  this.w = conf.world.width;
  this.h = conf.world.height;  

  this.getMass = function()
  {
    var m= this.radius * this.radius;
    if(this.density)
      m *= this.density;
    return m;
  }


  this.getMomentum = function()
  {
    return this.getMass() * Math.sqrt(this.dx*this.dx + this.dy*this.dy);
  }

  this.getRadius = function ()
  {
    return this.radius;
  }

  this.resetInitPos = function(x,y)
  {
    this._x = x;
    this._y = y;

    this.x = x;
    this.y = y;
  }


  this.reset = function()
  {
    this.x=this._x;
    this.y=this._y;
    this.ax=0;
    this.ay=0;
    this.dx=this._dx;
    this.dy=this._dy;
  }

  this.move = function()
  {
    // Accelerazione
    this.dx += this._ax + this.ax;
    this.dy += this._ay + this.ay;

    // Rimbalzo
    if(this.x + this.dx > this.w - this.radius || this.x + this.dx < this.radius) {
        this.dx = - config.elastCoeff * this.dx;
    }

    if(this.y + this.dy > this.h - this.radius || this.y + this.dy < this.radius) {
        this.dy = - config.elastCoeff * this.dy;
    }

    // Spostamento
    this.x = this.x + this.dx;
    this.y = this.y + this.dy;

    //this.grpobj.x(_x);
    //this.grpobj.y(_y);

    //this.setVectors();
  }

  this.prepareForInteract = function()
  {
    this.ax=0;
    this.ay=0;
  }

  /*this.setVectors = function()
  {
    debugger;
    var x = this.grpobj.x();
    var y = this.grpobj.y();
    this.spd.points([x,y, x+this.dx * config.displayFactorSpeed, y+this.dy * config.displayFactorSpeed]);
    this.acc.points([x,y, x+this.ax * config.displayFactorAccel, y+this.ay * config.displayFactorAccel]);

  }*/
}



