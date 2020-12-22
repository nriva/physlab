/**
 * 
 * @param {*} conf Configuration for the new Body 
 * @param {*} world Configuration of the world
 */
function Body(conf, world) {

  /**
   * Inital value for x.
   */
  this._x = conf.x;
  /**
   * Inital value for y.
   */
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

  this.world = world;  

  this.getMass = function()
  {
    var m= this.radius * this.radius;
    if(this.density)
      m *= this.density;
    return m;
  }

  /**
   * @todo unused
   */
  this.getMomentum = function()
  {
    return this.getMass() * Math.sqrt(this.dx*this.dx + this.dy*this.dy);
  }

  this.getRadius = function ()
  {
    return this.radius;
  }

  this.setNewPos = function(x,y,initial)
  {
    if(initial) {
      this._x = x;
      this._y = y;
    }

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
    // Acceleration
    this.dx += this._ax + this.ax;
    this.dy += this._ay + this.ay;

    // Bounce
    if(this.x + this.dx > this.world.width - this.radius || this.x + this.dx < this.radius) {
        this.dx = - config.elastCoeff * this.dx;
    }

    if(this.y + this.dy > this.world.height - this.radius || this.y + this.dy < this.radius) {
        this.dy = - config.elastCoeff * this.dy;
    }

    // Movement
    this.x = this.x + this.dx;
    this.y = this.y + this.dy;
  }

  this.prepareForInteract = function()
  {
    this.ax=0;
    this.ay=0;
  }

  /**
   * @returns the configuration of the initial state of the Body.
   */
  this.getConfiguration = function() {

    var conf = {};
    conf.x = this._x;
    conf.y = this._y;
    conf.ax = this._ax;
    conf.ay = this._ay;
    conf.dx = this._dx;
    conf.dy = this._dy;
  
    conf.density = this.density;
    conf.index = this.index;
  
    conf.radius = this.radius;

    return conf;
  }
}



