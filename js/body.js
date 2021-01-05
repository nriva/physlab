/**
 * 
 * @param {*} conf Configuration for the new Body 
 * @param {*} world Configuration of the world
 */
function Body(conf, world) {

  this.setAttributes = function(attr) {

    if(typeof attr.x != "undefined") this.x = attr.x;
    if(typeof attr.y != "undefined") this.y = attr.y;
    if(typeof attr.ax != "undefined") this._ax = attr.ax;
    if(typeof attr.ay != "undefined") this._ay = attr.ay;
    if(typeof attr.dx != "undefined") this.dx=attr.dx;
    if(typeof attr.dy != "undefined") this.dy=attr.dy;

    this.density = attr.density;
    this.radius = attr.radius;
    this.motionless = Boolean(conf.motionless);  
  }

  this.index = conf.index;
  this.color = conf.color;

  this.setAttributes(conf);
  this._x = this.x;
  this._y = this.y;
  this._dx= this.dx;
  this._dy= this.dy;
  this.ax=0;
  this.ay=0;


  this.world = world;  

  this.id = "B" + String(conf.index).padStart(4, '0');

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
  this.getMomentum = function() {
    return this.getMass() * Math.sqrt(this.dx*this.dx + this.dy*this.dy);
  }

  this.getRadius = function() {
    return this.radius;
  }

  this.setNewPos = function(x,y,initial) {
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

  this.move = function() {

    if(this.motionless)
      return;

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
  this.getAttributes = function() {

    var conf = {};
    conf.id = this.id;
    conf.x = this._x;
    conf.y = this._y;
    conf.ax = this._ax;
    conf.ay = this._ay;
    conf.dx = this._dx;
    conf.dy = this._dy;
  
    conf.density = this.density;
    conf.index = this.index;
  
    conf.radius = this.radius;
    conf.motionless = this.motionless;
    conf.color = this.color;

    return conf;
  }
}

function System(name) {

  this.name = name;
  this.bodies = [];
  this.gbodies = [];

  this.config = {G: config.G, elastCoeff: config.elastCoeff};
  this.defaultConfig = {G: config.G, elastCoeff: config.elastCoeff};
  this.bodiesAttr = [];

  this.clearAllBodies = function()
  {
    this.gbodies.forEach(
      (grpbody) => {
        grpbody.body.destroy();
        if(grpbody.acc) grpbody.acc.destroy();
        if(grpbody.spd) grpbody.spd.destroy();
      }
    )
    //this.bodies = [];
    this.gbodies = [];
  }


  this.getAttributes = function()
  {
    var bodiesAttr = [];
    this.bodies.forEach((body)=> {
      var bodyAttr = body.getAttributes();
      bodiesAttr.push(bodyAttr);  
    });
    return bodiesAttr;
  }
}



