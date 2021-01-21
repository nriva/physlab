/**
 * 
 * @param {*} conf Configuration for the new Body 
 * @param {*} world Configuration of the world
 */
function Body(attributes, world, config)  {

  this._setAttributes = function(attr) {

    if(typeof attr.x != "undefined") this.x = attr.x;
    if(typeof attr.y != "undefined") this.y = attr.y;
    if(typeof attr.ax != "undefined") this._ax = attr.ax;
    if(typeof attr.ay != "undefined") this._ay = attr.ay;
    if(typeof attr.dx != "undefined") this.dx=attr.dx;
    if(typeof attr.dy != "undefined") this.dy=attr.dy;

    this.density = attr.density;
    this.radius = attr.radius;
    this.motionless = Boolean(attr.motionless);  
  }

  this.index = attributes.index;
  this.color = attributes.color;

  this._setAttributes(attributes);
  this._x = this.x;
  this._y = this.y;
  this._dx= this.dx;
  this._dy= this.dy;
  this.ax=0;
  this.ay=0;

  this.max_dx = 10;
  this.max_dy = 10;

  this.world = world;  
  this.config = config;

  this.id = "B" + String(this.index).padStart(4, '0');
  if(typeof attributes.name != "undefined") 
    this.name=attributes.name;
  else
    this.name=this.id;
  

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

  this.move = function(world) {

    if(this.motionless)
      return;

    this.world.width = world.width;
    this.world.height = world.height;

    // Acceleration
    this.dx += this._ax + this.ax;
    this.dy += this._ay + this.ay;

    // Bounce
    if(this.x + this.dx > this.world.width - this.radius || this.x + this.dx < this.radius) {
        this.dx = - this.config.elastCoeff * this.dx;
    }

    if(this.y + this.dy > this.world.height - this.radius || this.y + this.dy < this.radius) {
        this.dy = - this.config.elastCoeff * this.dy;
    }

    // Movement
    if(this.dx>this.max_dx) this.dx = this.max_dx;
    if(this.dy>this.max_dy) this.dy = this.max_dy;

    if(this.dx<-this.max_dx) this.dx = -this.max_dx;
    if(this.dy<-this.max_dy) this.dy = -this.max_dy;

    this.x = this.x + this.dx;
    this.y = this.y + this.dy;
  }

  this.prepareForInteract = function()
  {
    this.ax=0;
    this.ay=0;
  }

  /**
   * @returns the configuration of the state of the Body.
   */
  this.getAttributes = function() {

    var conf = {};
    conf.id = this.id;
    conf._x = this._x;
    conf._y = this._y;
    conf.x = this.x;
    conf.y = this.y;

    conf.ax = this.ax;
    conf.ay = this.ay;
    conf.dx = this.dx;
    conf.dy = this.dy;

    conf._ax = this._ax;
    conf._ay = this._ay;
    conf._dx = this._dx;
    conf._dy = this._dy;

  
    conf.density = this.density;
    conf.index = this.index;
  
    conf.radius = this.radius;
    conf.motionless = this.motionless;
    conf.color = this.color;

    return conf;
  }

  this.setAttributes = function(attr) {

    if(typeof attr.x != "undefined") this.x = attr.x;
    if(typeof attr.y != "undefined") this.y = attr.y;
    if(typeof attr.ax != "undefined") this.ax = attr.ax;
    if(typeof attr.ay != "undefined") this.ay = attr.ay;
    if(typeof attr.dx != "undefined") this.dx = attr.dx;
    if(typeof attr.dy != "undefined") this.dy = attr.dy;

    if(typeof attr._x != "undefined") {
      this._x = attr._x;
      this.x = attr._x;
    }
    if(typeof attr._y != "undefined") {
      this._y = attr._y;
      this.y = attr._y;
    }
    if(typeof attr._ax != "undefined") {
      this._ax = attr._ax;
      this.ax = attr._ax;
    }
    if(typeof attr._ay != "undefined") {
      this._ay = attr._ay;
      this.ay = attr._ay;
    }
    if(typeof attr._dx != "undefined") {
      this._dx = attr._dx;
      this.dx = attr._dx;
    }
    if(typeof attr._dy != "undefined") {
      this._dy = attr._dy;
      this.dy = attr._dy;
    }

    if(typeof attr.density != "undefined") this.density = attr.density;
    if(typeof attr.radius != "undefined") this.radius = attr.radius;
    if(typeof attr.motionless != "undefined") this.motionless = Boolean(attr.motionless);  
  }

}

function System(name, config, moduleConfig) {

  this.name = name;
  this.bodies = [];
  this.gbodies = [];

  this.config = {elastCoeff: config.elastCoeff};
  this.defaultConfig = {elastCoeff: config.elastCoeff};
  this.bodiesAttr = [];

  moduleConfig.forEach((elem) =>
  {
    this.config[elem.propName] = config[elem.propDefName];
    this.defaultConfig[elem.propName] = config[elem.propDefName];
  });

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

  this.toJSON = function() {
    return { 
      config: this.config,
      bodiesAttr: this.getAttributes()
    };
  }
}


module.exports = {Body, System};
