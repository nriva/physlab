var version = "0.1.0-alpha";

var defaultConfig = { 
  elastCoeff : 0.75
  , G: 0.01
  , displayFactorSpeed : 50
  , displayFactorAccel : 1000
  , speedVisible : true
  , accelVisible : true
  , spdColor: "#000000"
  , accColor: "#EE0000" };

var config = defaultConfig;

var newConf = localStorage.getItem("config");
if(newConf) config = JSON.parse(newConf);

// TODO: save various systems
var systems = null;

// Ugly status vars
var animationOn = false;
var inEdit = false;
var inConfig = false;

var width = window.innerWidth;
var height = window.innerHeight-10;

var bodies = [];
var grpbodies = [];

var world = null;

var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
});

var layer = new Konva.Layer();
stage.add(layer);

var centerX = stage.getWidth() / 2;
var centerY = stage.getHeight() / 2;

function showConfig() {

  if(inEdit)
    return;

  if(inConfig) {
    //hideConfig();
    return;
  }

  var modal = document.getElementById("modalConfig");
  modal.style.display = "block";

  enableBtn("startBtn", false);
  enableBtn("stopBtn", false);

  refreshConfig();
  inConfig = true;
}

function refreshConfig() {
  document.getElementById('elastCoeff').value = config.elastCoeff;
  document.getElementById('constG').value = config.G;

  setCheckBox('accVis', config.accelVisible);
  document.getElementById('accMagn').value = config.displayFactorAccel;

  setCheckBox('spdVis', config.speedVisible);
  document.getElementById('spdMagn').value = config.displayFactorSpeed;
}

function closeConfig() {
  var n = Number(document.getElementById('elastCoeff').value);
  if(!isNaN(n)) {
    config.elastCoeff = n;
  }

  n = Number(document.getElementById('constG').value);
  if(!isNaN(n)) {
    config.G = n;
  }

  config.accelVisible = document.getElementById('accVis').checked;
  
  n = Number(document.getElementById('accMagn').value);
  if(!isNaN(n)) {
    config.displayFactorAccel = n;
  }

  config.speedVisible = document.getElementById('spdVis').checked;

  n = Number(document.getElementById('spdMagn').value);
  if(!isNaN(n)) {
    config.displayFactorSpeed = n;
  }

  localStorage.setItem("config", JSON.stringify(config));
  hideConfig();
}

function resetConfig() {
  localStorage.removeItem("config");
  config = defaultConfig;
  refreshConfig();
  closeConfig();
}

function hideConfig() {
  var modal = document.getElementById("modalConfig");
  modal.style.display = "none";
  inConfig = false;
  if(bodies.length>0) {
    enableBtn("startBtn",true);
    enableBtn("stopBtn", true);
  }
}

function setAnimationOn(on) {
  animationOn = on;
  enableBtn("showConfigBtn", !animationOn);
  enableBtn("newBtn", !animationOn);
}

function start() {
    if(!animationOn)
    {
      setAnimationOn(true);
      anim.start();
    }
}

function stop() {
  setAnimationOn(false);
  anim.stop();
}

function reset() {
  for(var i=0;i<bodies.length;i++) {
    bodies[i].reset();
    grpbodies[i].body.x(bodies[i].x);
    grpbodies[i].body.y(bodies[i].y);
    if(grpbodies[i].spd) grpbodies[i].spd.points([0,0,0,0]);
    if(grpbodies[i].acc) grpbodies[i].acc.points([0,0,0,0]);
    refreshBodyData(bodies[i]);
  }
  stage.draw();
}
  
function cancelNew() {
  inEdit = false;

  var modal = document.getElementById("newbodyprops");
  modal.style.display = "none";



  document.getElementById("inRadius").value="10";
  document.getElementById("inAx").value="0";
  document.getElementById("inAy").value="0";
  document.getElementById("inDx").value="0";
  document.getElementById("inDy").value="0";
  document.getElementById("inDensity").value="1";
  document.getElementById("inColor").value="#FFFFFF";
  setCheckBox("inMotionless", false);
  
}

function confirmNew() {

  var radius = Number(document.getElementById("inRadius").value);
  var ax = Number(document.getElementById("inAx").value);
  var ay = Number(document.getElementById("inAy").value);
  var dx = Number(document.getElementById("inDx").value);
  var dy = Number(document.getElementById("inDy").value);
  var density = Number(document.getElementById("inDensity").value);
  var color = document.getElementById("inColor").value;
  var motionless = document.getElementById("inMotionless").checked==true;

    var conf = {index:bodies.length
      ,x: centerX ,y: centerY
      ,dx: dx, dy: dy
      ,ax: ax, ay: ay
      ,density: density
      ,radius: radius
      ,color: color
      ,motionless: motionless
    };

  addNewBody(conf);

  cancelNew();

  stage.draw();
  
}

function addNewBody(conf) {

  var grpbody1 = new Konva.Circle({
  x: conf.x, 
  y: conf.y,
  radius: conf.radius,
  fill: conf.color,// '#00D2FF',
  strokeWidth: 0,
  draggable: true
  });

  layer.add(grpbody1);

  var acc1 = null;
  if(config.accelVisible) {
    acc1 = new Konva.Line({
      points: [0,0,0,0],
      stroke: config.accColor,
      draggable: false
    });
    layer.add(acc1);
  }

  var spd1 = null;
  if(config.speedVisible) {
    spd1 = new Konva.Line({
      points: [0,0,0,0],
      stroke: config.spdColor,
      draggable: false
    });
    layer.add(spd1);
  }



  if(world==null)
    world={width:stage.getWidth(),height:stage.getHeight()};
  //var body1 = new Body(ax,ay,dx,dy,density,{body:grpbody1,acc:acc1,spd:spd1},bodies.length);
  var body1 = new Body(conf, world);
  //body1.setGraphObjs({body:grpbody1,acc:acc1,spd:spd1});
  bodies.push(body1);
  grpbodies.push({body:grpbody1,acc:acc1,spd:spd1});
  addToList(body1,bodies.length-1,conf.color);

  grpbody1.on("dragend", function()
  {
    var grp = arguments[0].target;
    var x = grp.x();
    var y = grp.y();

    var index = grpbodies.findIndex( (elem) => elem.body == grp );
    bodies[index].setNewPos(x,y,!animationOn);

    document.getElementById("x" + body1.index).innerText = Math.floor(x);
    document.getElementById("y" + body1.index).innerText = Math.floor(y);

  }); 
  refreshButtons();
}

function refreshButtons() {
  enableBtn("startBtn",bodies.length>0);
  enableBtn("stopBtn", bodies.length>0);
  enableBtn("saveBtn", bodies.length>0);
}

function addToList(body, postion, color) {
  //'<tr><td><span style="color: brown;">ID</span></td> <td>position</td> <td><button onclick="remove(1)">Remove</button></td></tr>';


  var table = document.getElementById("tbbodies");

  // Create an empty <tr> element and add it to the 1st position of the table:
  var row = table.insertRow(table.length);
  row.id = 'row' + postion;
  row.className = 'bodyrow';

  // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
  var cell1 = row.insertCell(0); cell1.style = "width: 10%";
  var cell2 = row.insertCell(1); cell2.style = "width: 25%";
  var cell3 = row.insertCell(2); cell3.style = "width: 25%";
  var cell4 = row.insertCell(3); cell4.style = "width: 25%";
  var cell5 = row.insertCell(4); //cell5.style = "width: 10%";

  // Add some text to the new cells:
  cell1.innerHTML = `<span style="color: '${color}';">${body.motionless?'<B>':''}${postion}${body.motionless?'</B>':''}</span>`;
  cell2.innerHTML = `(<span id="x${postion}">${body._x}</span>,<span id="y${postion}">${body._y}</span>)`;
  cell3.innerHTML = `(<span id="sx${postion}">${body._dx}</span>,<span id="sy${postion}">${body._dy}</span>)`;
  cell4.innerHTML = `(<span id="ax${postion}">${body._ax}</span>,<span id="ay${postion}">${body._ay}</span>)`;
  cell5.innerHTML = `<button onclick="remove(${postion},'${body.id}')"><i class="fa fa-trash"></button>`;
}

function clearAllBodies() {
  var rows = document.getElementsByClassName('bodyrow');
  rowIds = [];
  for(var i=0;i<rows.length;i++)
  {
    rowIds.push(rows[i].rowIndex);
  }

  rowIds.forEach((i)=>document.getElementById("tbbodies").deleteRow(0));

  grpbodies.forEach(
    (grpbody) => {
      grpbody.body.destroy();
      if(grpbody.acc) grpbody.acc.destroy();
      if(grpbody.spd) grpbody.spd.destroy();
    }
  )
  bodies = [];
  grpbodies = [];
  layer.draw();
  refreshButtons();
}

function refreshBodyData(body) {
  var x = document.getElementById("x" + body.index);
  var y = document.getElementById("y" + body.index);
  var sx = document.getElementById("sx" + body.index);
  var sy = document.getElementById("sy" + body.index);
  var ax = document.getElementById("ax" + body.index);
  var ay = document.getElementById("ay" + body.index);

  x.innerText = body.x;
  y.innerText=body.y;
  sx.innerText=body.dx;
  sy.innerText=body.dy;
  ax.innerText=body.ax;
  ay.innerText=body.ay;
}


function remove(position, id) {
  if(bodies.length===0)
    return;

  var row = document.getElementById('row'+position);

  if(row) {
    var i = row.rowIndex;
    document.getElementById("bodies").deleteRow(i);
  }

  var idx = 0;

  for(var b=0;b<bodies.length;b++)
  {
    if(bodies[b].id === id)
      idx = b;
  }

  var body = bodies[0];
  var grpbody = grpbodies[0];
  if(bodies.length>1) {
    body = bodies.splice(idx,1)[0];
    grpbody = grpbodies.splice(idx,1)[0];
  }
  else {
    bodies = [];
    grpbodies = [];
  }
  refreshButtons();
  if(body) {
    
    //body.grpobj.visible(false); 
    grpbody.body.destroy();
    //body.acc.visible(false); 
    if(grpbody.acc) grpbody.acc.destroy();
    //body.spd.visible(false); 
    if(grpbody.spd) grpbody.spd.destroy();

    layer.draw();
  }
}

function addNew() {
  var modal = document.getElementById("newbodyprops");
  modal.style.display = "block";
  inEdit = true;
  enableBtn("startBtn",false);
  enableBtn("stopBtn", false);
}



function refresh(grpbody,body) {
  document.getElementById("x" + body.index).innerText = Math.floor(body.x);
  document.getElementById("y" + body.index).innerText = Math.floor(body.y);


  document.getElementById("sx" + body.index).innerText = Number(body.dx).toFixed(3);
  document.getElementById("sy" + body.index).innerText = Number(body.dy).toFixed(3);

  document.getElementById("ax" + body.index).innerText = Number(body.ax).toFixed(3);
  document.getElementById("ay" + body.index).innerText = Number(body.ay).toFixed(3);   

  var x = body.x;
  var y = body.y;

  grpbody.body.x(x);
  grpbody.body.y(y);


  if(grpbody.spd) grpbody.spd.points([x,y, x+body.dx * config.displayFactorSpeed, y+body.dy * config.displayFactorSpeed]);
  if(grpbody.acc) grpbody.acc.points([x,y, x+body.ax * config.displayFactorAccel, y+body.ay * config.displayFactorAccel]);
}

function load() {

  clearAllBodies();

  var configurations = JSON.parse(localStorage.getItem("systems"));
  configurations.forEach(
    (conf) => {
      addNewBody(conf, world);
    }
  );
  stage.draw();
}
    
function save() {

  var configurations = [];
  bodies.forEach((body)=> {
    var bodyConf = body.getConfiguration();
    bodyConf.color = grpbodies[body.index].body.fill();
    configurations.push(bodyConf);  
  })

    localStorage.setItem("systems", JSON.stringify(configurations));
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
          refresh(grpbodies[b],bodies[b]);
        }
      }
  }, layer);


function enableBtn(id,enable) {
  if(enable===true) {
    if(document.getElementById(id).hasAttribute("disabled"))
      document.getElementById(id).removeAttribute("disabled");
  }
  else if(enable===false) {
    document.getElementById(id).setAttribute("disabled", "true");
  }
}
  
  
function setCheckBox(id, value) {
  document.getElementById(id).checked = value;
}

function init() {
  document.getElementById("footerVersion").innerText = "Version " + version;

  var span = document.getElementById("closeConfig");

  span.onclick = hideConfig;

  span = document.getElementById("closeNewBody");

  span.onclick = cancelNew;
}


init();



