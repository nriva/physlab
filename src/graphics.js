//var world = { width: 3000,  height: 2000 };


function GraphicEnvironment(window) {

    this.world = { width: window.innerWidth,  height: window.innerHeight /*-10*/ };
  
    this.stage = new Konva.Stage({
        container: 'container',
        width: this.world.width,
        height: this.world.height
    });
  
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
  
    this.centerX = this.stage.getWidth() / 2;
    this.centerY = this.stage.getHeight() / 2;
  
    this.fitStageIntoParentContainer = function() {
      var container = document.getElementById('stage-parent');
  
      // now we need to fit stage into parent
      var containerWidth = container.offsetWidth;
      var containerHeight = container.offsetHeight;
      // to do this we need to scale the stage
      //var scale = containerWidth / world.width;
  
      this.stage.width( containerWidth /* world.width * scale*/);
      this.stage.height(containerHeight);
  
      this.world.width = containerWidth;
      this.world.height = containerHeight;
  
      //stage.scale({ x: scale, y: scale });
      this.stage.draw();
  
      this.centerX = this.stage.getWidth() / 2;
      this.centerY = this.stage.getHeight() / 2;
  
    }
}

module.exports = {
    GraphicEnvironment
  }
  