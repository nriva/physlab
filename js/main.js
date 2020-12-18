var ELAST_COEFF = 0.75;

var animationOn = false;
var inEdit = false;

var width = window.innerWidth;
var height = window.innerHeight-10;

var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
});

var layer = new Konva.Layer();
stage.add(layer);
var rectX = 20; //stage.getWidth() / 2 - 50;
var rectY = 20; //stage.getHeight() / 2 - 25;

var centerX = stage.getWidth() / 2;
var centerY = stage.getHeight() / 2;


function config()
{
  if(inEdit)
    return;

    document.getElementById('elastCoeff').value = ELAST_COEFF;
    document.getElementById("configpanel").style="visibility:visible";
}

function closeConfig()
{
    var n = Number(document.getElementById('elastCoeff').value);
    if(!isNaN(n))
      ELAST_COEFF = n;
    document.getElementById("configpanel").style="visibility:hidden";
}

function start() {
    if(!animationOn)
    {
      animationOn = true;
      anim.start();
    }
  }

  function stop()
  {
    animationOn=false;
    anim.stop();
  }

  function reset()
  {
    for(var i=0;i<bodies.length;i++)
      bodies[i].reset();

    stage.draw();
  }
  
  function cancelNew()
  {
    inEdit = false;
    document.getElementById("newbodyprops").style="visibility:hidden";
    document.getElementById("inRadius").value="10";
    document.getElementById("inAx").value="0";
    document.getElementById("inAy").value="0";
    document.getElementById("inDx").value="0";
    document.getElementById("inDy").value="0";
    document.getElementById("inDensity").value="1";
    
  }

  function confirmNew()
  {

    var radius = Number(document.getElementById("inRadius").value);
    var ax = Number(document.getElementById("inAx").value);
    var ay = Number(document.getElementById("inAy").value);
    var dx = Number(document.getElementById("inDx").value);
    var dy = Number(document.getElementById("inDy").value);
    var density = Number(document.getElementById("inDensity").value);

    var color = document.getElementById("inColor").value;


    var grpbody1 = new Konva.Circle({
    x: centerX, 
    y: centerY,
    radius: radius,
    fill: color,// '#00D2FF',
    strokeWidth: 0,
    draggable: true
    });

    

    var acc1 = new Konva.Line({
        points: [0,0,0,0],
        stroke:'#EE0000',
        draggable: false
    });

    var spd1 = new Konva.Line({
        points: [0,0,0,0],
        stroke:'#000000',
        draggable: false
    });


    layer.remove

    layer.add(grpbody1);
    layer.add(acc1);
    layer.add(spd1);
    var body1 = new Body(ax,ay,dx,dy,density,{body:grpbody1,acc:acc1,spd:spd1},bodies.length);

    bodies.push(body1);
    addToList(body1,bodies.length-1,color);

    grpbody1.on("dragend", function()
    {
      body1.resetInitPos();
      document.getElementById("x" + body1.index).innerText = Math.floor(body1.x());
      document.getElementById("y" + body1.index).innerText = Math.floor(body1.y());

    }); 

    cancelNew();
    stage.draw();
  }

  function addToList(body,postion, color)
  {
    //'<tr><td><span style="color: brown;">ID</span></td> <td>position</td> <td><button onclick="remove(1)">Remove</button></td></tr>';


    var table = document.getElementById("tbbodies");

    // Create an empty <tr> element and add it to the 1st position of the table:
    var row = table.insertRow(table.length);
    row.id = 'row' + postion;

    // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);

    // Add some text to the new cells:
    cell1.innerHTML = '<span style="color: ' + color +';">' + postion  + '</span>';
    cell2.innerHTML = `(<span id="x${postion}">${body.inix}</span>,<span id="y${postion}">${body.iniy}</span>)`;
    cell3.innerHTML = `(<span id="sx${postion}"></span>,<span id="sy${postion}"></span>)`;
    cell4.innerHTML = `(<span id="ax${postion}"></span>,<span id="ay${postion}"></span>)`;
    cell5.innerHTML = '<button onclick="remove(' + postion +')">Remove</button>';

  }

  function remove(id)
  {
    if(bodies.length===0)
      return;

    var row = document.getElementById('row'+id);

    if(row) {
      var i = row.rowIndex;
      document.getElementById("bodies").deleteRow(i);    
    }

    var body = bodies[0];
    if(bodies.length>1)
      body = bodies.splice(id,1)[0];
    if(body) {
      //body.grpobj.visible(false); 
      body.grpobj.destroy();
      //body.acc.visible(false); 
      body.acc.destroy();
      //body.spd.visible(false); 
      body.spd.destroy();

      layer.draw();
    }
  }

  function addNew()
  {
    document.getElementById("newbodyprops").style="visibility:visible";
    inEdit = true;
  }

  var bodies = [];
    

  var anim = new Konva.Animation(function(frame) {
      collisionManagement(bodies, stop);
      if(animationOn)
      {

        for(var i=0;i<bodies.length;i++)
          bodies[i].prepareForInteract();

       interaction(bodies);

        for(var b=0;b<bodies.length;b++)
        {
          bodies[b].move();
          document.getElementById("x" + bodies[b].index).innerText = Math.floor(bodies[b].x());
          document.getElementById("y" + bodies[b].index).innerText = Math.floor(bodies[b].y());


          document.getElementById("sx" + bodies[b].index).innerText = Number(bodies[b].dx).toFixed(3);
          document.getElementById("sy" + bodies[b].index).innerText = Number(bodies[b].dy).toFixed(3);

          document.getElementById("ax" + bodies[b].index).innerText = Number(bodies[b].ax).toFixed(3);
          document.getElementById("ay" + bodies[b].index).innerText = Number(bodies[b].ay).toFixed(3);

        }
      }
  }, layer);


  var toolTipShown = false;

  var messages = {"t01": "Value for acceleration (use Small values ~0.01)",
                "t02": "Values for speed (use values around 1)"};

  function showTooltip(bShow, id) {
    if(toolTipShown && bShow)
      return;

      if(bShow)
      {
        var msg = messages[id];
        document.getElementById("tooltip2").innerText = msg;
      }

    document.getElementById("line2").style.visibility = bShow? "visible" : "hidden";
    toolTipShown = bShow;
  }


  //anim.start();
