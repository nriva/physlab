var version = "0.0.1";
var defaultConfig = { elastCoeff : 0.75, G: 0.01,
  displayFactorSpeed : 50,
  displayFactorAccel : 5000,
  spdColor: "#000000", accColor: "#EE0000" };

var config = defaultConfig;

var newConf = localStorage.getItem("config");
if(newConf) config = JSON.parse(newConf);

// Ugly status vars
var animationOn = false;
var inEdit = false;
var inConfig = false;

var width = window.innerWidth;
var height = window.innerHeight-10;

var bodies = [];

var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
});

var layer = new Konva.Layer();
stage.add(layer);

var centerX = stage.getWidth() / 2;
var centerY = stage.getHeight() / 2;


function showConfig()
{
  if(inEdit)
    return;

  if(inConfig) {
    hideConfig();
    return;
  }
    

  refreshConfig();
  document.getElementById("configpanel").style="visibility:visible";
  inConfig = true;
}

function refreshConfig()
{
  document.getElementById('elastCoeff').value = config.elastCoeff;
  document.getElementById('constG').value = config.G;
}

function closeConfig()
{
    var n = Number(document.getElementById('elastCoeff').value);
    if(!isNaN(n)) {
      config.elastCoeff = n;
      localStorage.setItem("config", JSON.stringify(config));
    }

    var n = Number(document.getElementById('constG').value);
    if(!isNaN(n)) {
      config.G = n;
      localStorage.setItem("config", JSON.stringify(config));
    }


    hideConfig();
}

function resetConfig() {
  localStorage.removeItem("config");
  config = defaultConfig;
  refreshConfig();
  closeConfig();
}

function hideConfig()
{
  document.getElementById("configpanel").style="visibility:hidden";
  inConfig = false;
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
    for(var i=0;i<bodies.length;i++) {
      bodies[i].reset();
      refreshBodyData(bodies[i]);
    }


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
        stroke: config.accColor,
        draggable: false
    });

    var spd1 = new Konva.Line({
        points: [0,0,0,0],
        stroke: config.spdColor,
        draggable: false
    });


    //layer.remove

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
    var cell1 = row.insertCell(0); cell1.style = "width: 10%";
    var cell2 = row.insertCell(1); cell2.style = "width: 25%";
    var cell3 = row.insertCell(2); cell3.style = "width: 25%";
    var cell4 = row.insertCell(3); cell4.style = "width: 25%";
    var cell5 = row.insertCell(4); //cell5.style = "width: 10%";

    // Add some text to the new cells:
    cell1.innerHTML = '<span style="color: ' + color +';">' + postion  + '</span>';
    cell2.innerHTML = `(<span id="x${postion}">${body.inix}</span>,<span id="y${postion}">${body.iniy}</span>)`;
    cell3.innerHTML = `(<span id="sx${postion}">${body._dx}</span>,<span id="sy${postion}">${body._dy}</span>)`;
    cell4.innerHTML = `(<span id="ax${postion}">${body._ax}</span>,<span id="ay${postion}">${body._ay}</span>)`;
    cell5.innerHTML = '<button onclick="remove(' + postion +')"><i class="fa fa-trash"></button>';
  }

  function refreshBodyData(body)
  {
    var x = document.getElementById("x" + body.index);
    var y = document.getElementById("y" + body.index);
    var sx = document.getElementById("sx" + body.index);
    var sy = document.getElementById("sy" + body.index);
    var ax = document.getElementById("ax" + body.index);
    var ay = document.getElementById("ay" + body.index);

    x.innerText = body.inix;
    y.innerText=body.iniy;
    sx.innerText=body._dx;
    sy.innerText=body._dy;
    ax.innerText=body._ax;
    ay.innerText=body._ay;
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



  function refresh(body)
  {
    document.getElementById("x" + body.index).innerText = Math.floor(body.x());
    document.getElementById("y" + body.index).innerText = Math.floor(body.y());


    document.getElementById("sx" + body.index).innerText = Number(body.dx).toFixed(3);
    document.getElementById("sy" + body.index).innerText = Number(body.dy).toFixed(3);

    document.getElementById("ax" + body.index).innerText = Number(body.ax).toFixed(3);
    document.getElementById("ay" + body.index).innerText = Number(body.ay).toFixed(3);    
  }
    

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
          refresh(bodies[b]);


        }
      }
  }, layer);


  // Tooltips

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

  function init() {
    document.getElementById("footerVersion").innerText = "Version " + version;
  }

  init();


  //anim.start();
