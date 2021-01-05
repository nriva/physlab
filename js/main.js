var version = "0.2.0-alpha";

var defaultConfig = { 
  elastCoeff : 1
  , G: 0.01
  , displayFactorSpeed : 50
  , displayFactorAccel : 1000
  , speedVisible : true
  , accelVisible : true
  , spdColor: "#000000"
  , accColor: "#EE0000"
  , shadow: true };

// TODO: save various systems
var demoSystems = {
  "name1": {
  config: {G: 0.01,elastCoeff:1},
  bodiesAttr: [
    {"id":"B0000","x":960,"y":463.5,"ax":0,"ay":0,"dx":0,"dy":0,"density":1,"index":0,"radius":20,"motionless":false,"color":"yellow"}
    ,{"id":"B0001","x":957,"y":191.5,"ax":0,"ay":0,"dx":2,"dy":0,"density":1,"index":1,"radius":10,"motionless":false,"color":"lightblue"}
  ],
  bodies : [],
  gbodies : []
  },
  "name2" : {
    config: {G: 0.01,elastCoeff:1},
    bodiesAttr: [
      {"id":"B0000","x":960,"y":463.5,"ax":0,"ay":0,"dx":0,"dy":0,"density":1,"index":0,"radius":20,"motionless":false,"color":"pink"}
      ,{"id":"B0001","x":957,"y":191.5,"ax":0,"ay":0,"dx":2,"dy":0,"density":1,"index":1,"radius":10,"motionless":false,"color":"blue"}],
      bodies : [],
      gbodies : []
  }
};
var demoMode = false;
if(window.location.search) {
  demoMode = window.location.search.indexOf('demo')>=0;
}

var config = defaultConfig;

var currentSystem=null;
var systems = {};

// Ugly status vars
var animationOn = false;
var inAddNew = false;
var inEdit = false;
var inConfig = false;
var currentEditId = -1;

var world = { width: window.innerWidth,  height: window.innerHeight-10 };


var stage = new Konva.Stage({
    container: 'container',
    width: world.width,
    height: world.height
});

var layer = new Konva.Layer();
stage.add(layer);

var centerX = stage.getWidth() / 2;
var centerY = stage.getHeight() / 2;


function fitStageIntoParentContainer() {
  var container = document.getElementById('stage-parent');

  // now we need to fit stage into parent
  var containerWidth = container.offsetWidth;
  // to do this we need to scale the stage
  var scale = containerWidth / world.width;

  stage.width(world.width * scale);
  stage.height(world.height * scale);
  stage.scale({ x: scale, y: scale });
  stage.draw();

  centerX = stage.getWidth() / 2;
  centerY = stage.getHeight() / 2;

}

fitStageIntoParentContainer();
// adapt the stage on any window resize
window.addEventListener('resize', fitStageIntoParentContainer);

function isEditing()
{
  return inAddNew || inEdit;
}


function setAnimationOn(on) {
  animationOn = on;

  var btns = document.getElementsByClassName('toolbar-edit-btn');
  for (let btn of btns)
    enableElem(btn, !animationOn);

  btns = document.getElementsByClassName('body-list-button');
  for (let btn of btns) {
    enableElem(btn, !animationOn);
  }

  btns = document.getElementsByClassName('sys-edit-btn');
  for (let btn of btns) {
    enableElem(btn, !animationOn);
  }

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
  for(var i=0;i<currentSystem.bodies.length;i++) {
    currentSystem.bodies[i].reset();
    currentSystem.gbodies[i].body.x(currentSystem.bodies[i].x);
    currentSystem.gbodies[i].body.y(currentSystem.bodies[i].y);
    if(currentSystem.gbodies[i].spd) currentSystem.gbodies[i].spd.points([0,0,0,0]);
    if(currentSystem.gbodies[i].acc) currentSystem.gbodies[i].acc.points([0,0,0,0]);
    refreshBodyData(currentSystem.bodies[i]);
  }
  stage.draw();
}
  
function cancelBodyEdit() {
  inAddNew = false;
  inEdit = false;

  var modal = document.getElementById("bodyattributes");
  modal.style.display = "none";

  document.getElementById("inRadius").value="10";
  document.getElementById("inAx").value="0";
  document.getElementById("inAy").value="0";
  document.getElementById("inDx").value="0";
  document.getElementById("inDy").value="0";
  document.getElementById("inDensity").value="1";
  document.getElementById("inColor").value="#FFFFFF";
  setCheckBox("inMotionless", false);

  enableElem("inColor",true);
  enableElem("inAx",true);
  enableElem("inAy",true);
  enableElem("inDx",true);
  enableElem("inDy",true);

  
}

function confirmBodyEdit() {

  var radius = Number(document.getElementById("inRadius").value);
  var ax = Number(document.getElementById("inAx").value);
  var ay = Number(document.getElementById("inAy").value);
  var dx = Number(document.getElementById("inDx").value);
  var dy = Number(document.getElementById("inDy").value);
  var density = Number(document.getElementById("inDensity").value);
  var color = document.getElementById("inColor").value;
  var motionless = document.getElementById("inMotionless").checked==true;

  if(inAddNew) {
    var attr = {index: currentSystem.bodies.length
      ,x: centerX ,y: centerY
      ,dx: dx, dy: dy
      ,ax: ax, ay: ay
      ,density: density
      ,radius: radius
      ,color: color
      ,motionless: motionless
    };

    var body = createNewBody(attr);
    addNewBodyToCanvas(body);
    addToBodyList(body, body.index);
  }

  if(inEdit) {
    var attr = {
      density: density
      ,radius: radius
      ,motionless: motionless
    };
    editBody(attr);
    refreshBodyData(body);
  }

  cancelBodyEdit();

  stage.draw();
  
}

function createNewBody(conf)
{
//var body1 = new Body(ax,ay,dx,dy,density,{body:grpbody1,acc:acc1,spd:spd1},bodies.length);
var body1 = new Body(conf, world);
//body1.setGraphObjs({body:grpbody1,acc:acc1,spd:spd1});
currentSystem.bodies.push(body1);
return body1;
}

function addNewBodyToCanvas(body) {

  var grpbody1 = new Konva.Circle({
  x: body.x, 
  y: body.y,
  radius: body.radius,
  fill: body.color,// '#00D2FF',
  strokeWidth: 0,
  draggable: true,
  });

  if(config.shadow) {
    grpbody1.shadowEnabled(true);
    grpbody1.shadowColor('black');
    grpbody1.shadowOffset({x: 2, y: 2});
    grpbody1.shadowBlur(10);
  }

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

  currentSystem.gbodies.push({body:grpbody1,acc:acc1,spd:spd1});
  


  grpbody1.on("dragend", function()
  {
    var graphbody = arguments[0].target;
    var x = graphbody.x();
    var y = graphbody.y();

    var index = currentSystem.gbodies.findIndex( (elem) => elem.body == graphbody );
    var body = currentSystem.bodies[index];
    body.setNewPos(x,y,!animationOn);

    document.getElementById("x" + body.index).innerText = Math.floor(x);
    document.getElementById("y" + body.index).innerText = Math.floor(y);

  }); 
  refreshButtons();
}

function editBody(attr) {

  if(currentEditId==-1)
    return;

  var body = currentSystem.bodies[currentEditId];
  body.setAttributes(attr);

  var graphbody = currentSystem.gbodies[currentEditId].body;

  graphbody.radius(attr.radius);

  currentEditId = -1;
  cancelBodyEdit();
  refreshButtons();
}

function refreshButtons() {
  enableElem("startBtn",currentSystem.bodies.length>0);
  enableElem("stopBtn", currentSystem.bodies.length>0);
  enableElem("saveBtn", currentSystem.bodies.length>0);
}

function addToBodyList(body, postion) {
  //'<tr><td><span style="color: brown;">ID</span></td> <td>position</td> <td><button onclick="remove(1)">Remove</button></td></tr>';
  var color = body.color;

  var table = document.getElementById("tbbodies");

  // Create an empty <tr> element and add it to the 1st position of the table:
  var row = table.insertRow(table.length);
  row.id = 'row' + postion;
  row.className = 'bodyrow';

  // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
  var cell1 = row.insertCell(0); 
  var cell2 = row.insertCell(1);
  var cell3 = row.insertCell(2);
  var cell4 = row.insertCell(3);
  var cell5 = row.insertCell(4); //cell5.style = "width: 10%";

  // Add some text to the new cells:
  cell1.innerHTML = `<span style="color: ${color};">${body.motionless?'<B>':''}${postion}${body.motionless?'</B>':''}</span>`;
  cell2.innerHTML = `(<span id="x${postion}">${body._x}</span>,<span id="y${postion}">${body._y}</span>)`;
  cell3.innerHTML = `(<span id="sx${postion}">${body._dx}</span>,<span id="sy${postion}">${body._dy}</span>)`;
  cell4.innerHTML = `(<span id="ax${postion}">${body._ax}</span>,<span id="ay${postion}">${body._ay}</span>)`;
  cell5.innerHTML = `<button class="body-list-button" onclick="remove(${postion},'${body.id}')"><i class="fa fa-trash"></button>`;
  cell5.innerHTML += `&nbsp;<button class="body-list-button" onclick="change(${postion},'${body.id}')"><i class="fa fa-pencil-square" aria-hidden="true"></i></button>`;
}


function clearBodyList() {
  var rows = document.getElementsByClassName('bodyrow');
  rowIds = [];
  for(var i=0;i<rows.length;i++)
  {
    rowIds.push(rows[i].rowIndex);
  }

  rowIds.forEach((i)=>document.getElementById("tbbodies").deleteRow(0));
}




function change(position, id) {
  var idx = -1;
  for(var b=0;b<currentSystem.bodies.length;b++)
  {
    if(currentSystem.bodies[b].id === id)
      idx = b;
  }

  if(idx==-1)
    return;

  currentEditId = idx;

  var body = currentSystem.bodies[idx];
  var attr = body.getAttributes();

  var gphbody = currentSystem.gbodies[idx].body;


  var modalHeaderCaption = document.getElementById('modalHeaderCaption');
  modalHeaderCaption.innerText = "Edit Body";

  var modal = document.getElementById("bodyattributes");
  modal.style.display = "block";
  inEdit = true;
  enableElem("startBtn",false);
  enableElem("stopBtn", false);


  document.getElementById("inRadius").value = attr.radius;
  document.getElementById("inAx").value = attr.ax;
  document.getElementById("inAy").value  = attr.ay;
  document.getElementById("inDx").value = attr.dx;
  document.getElementById("inDy").value = attr.dy;
  document.getElementById("inDensity").value = attr.density;
  document.getElementById("inColor").value = gphbody.fill();
  document.getElementById("inMotionless").checked==attr.motionless;

  enableElem("inColor", false);
  enableElem("inAx", false);
  enableElem("inAy", false);
  enableElem("inDx", false);
  enableElem("inDy", false);


}

function remove(position, id) {
  if(currentSystem.bodies.length===0)
    return;

  var row = document.getElementById('row'+position);

  if(row) {
    var i = row.rowIndex;
    document.getElementById("bodies").deleteRow(i);
  }

  var idx = 0;

  for(var b=0;b<currentSystem.bodies.length;b++)
  {
    if(currentSystem.bodies[b].id === id)
      idx = b;
  }

  var body = currentSystem.bodies[0];
  var grpbody = currentSystem.gbodies[0];
  if(currentSystem.bodies.length>1) {
    body = currentSystem.bodies.splice(idx,1)[0];
    grpbody = currentSystem.gbodies.splice(idx,1)[0];
  }
  else {
    currentSystem.bodies = [];
    currentSystem.gbodies = [];
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

  if(Object.keys(systems).length==0)
    newSystem();

  if(currentSystem==null)
    return;

  var modalHeaderCaption = document.getElementById('modalHeaderCaption');
  modalHeaderCaption.innerText = "New Body";

  var modal = document.getElementById("bodyattributes");
  modal.style.display = "block";
  inAddNew = true;
  enableElem("startBtn",false);
  enableElem("stopBtn", false);

  enableElem("inColor", true);
  enableElem("inAx", true);
  enableElem("inAy", true);
  enableElem("inDx", true);
  enableElem("inDy", true);
}

function refreshBodyData(body) {
  document.getElementById("x" + body.index).innerText = Math.floor(body.x);
  document.getElementById("y" + body.index).innerText = Math.floor(body.y);

  document.getElementById("sx" + body.index).innerText = Number(body.dx).toFixed(3);
  document.getElementById("sy" + body.index).innerText = Number(body.dy).toFixed(3);

  document.getElementById("ax" + body.index).innerText = Number(body.ax).toFixed(3);
  document.getElementById("ay" + body.index).innerText = Number(body.ay).toFixed(3);   
}



function refresh(grpbody,body) {

  refreshBodyData(body);

  var x = body.x;
  var y = body.y;

  grpbody.body.x(x);
  grpbody.body.y(y);


  if(grpbody.spd) grpbody.spd.points([x,y, x+body.dx * config.displayFactorSpeed, y+body.dy * config.displayFactorSpeed]);
  if(grpbody.acc) grpbody.acc.points([x,y, x+body.ax * config.displayFactorAccel, y+body.ay * config.displayFactorAccel]);
}

function load() {
  clearBodyList();

  var select = document.getElementById("systemName");
  var n = select.options.length;
  for (var i=0; i<n; i++) {
    select.remove(0);
  }

  var initSystems = JSON.parse(localStorage.getItem("systems"));
  if(demoMode)
    initSystems = demoSystems;
  if(initSystems) {  
    var systemNameSel = document.getElementById('systemName');
    var added = false;
    for(var sysname in initSystems)
    {
      var option = document.createElement("option");
      option.text = sysname;
      systemNameSel.add(option);
      added = true;
    }

    for(var sysname in initSystems) {
      initSystem = initSystems[sysname];

      systems[sysname] = new System(sysname);
      systems[sysname].bodiesAttr = initSystem.bodiesAttr;
      systems[sysname].config =  initSystem.config;
    }

    if(added)
      changeSystem();
    stage.draw();
  }
}
    
function save() {

  var saveSystems = {};

  for(var sysname in systems) {

/////
    var attr = systems[sysname].getAttributes();

    saveSystems[sysname] = { 
      config: systems[sysname].config,
      bodiesAttr: attr
    };
  }
  localStorage.setItem("systems", JSON.stringify(saveSystems));
}




function newSystem()
{
  var sysname = window.prompt('New System Name:', 'System' + Object.keys(systems).length);
  if(sysname)
  {
    
    var systemNameSel = document.getElementById('systemName');
    var option = document.createElement("option");
    option.text = sysname;
    option.selected = true;
    systemNameSel.add(option);
    var newSystem = new System(sysname, config);
    systems[sysname] = newSystem;
    changeSystem();
  }
}

function changeSystem()
{
  clearBodyList();
  if(typeof currentSystem != "undefined" && currentSystem != null) {
    currentSystem.clearAllBodies();
    stage.draw();
  }

  var systemName = document.getElementById('systemName').value;
  currentSystem = systems[systemName];

  if(typeof currentSystem == "undefined" || currentSystem == null)
    return;


  if(currentSystem.bodiesAttr.length>0) {
    for(var conf of currentSystem.bodiesAttr) {
      var body = createNewBody(conf);  
      addNewBodyToCanvas(body);
    }
    currentSystem.bodiesAttr = [];
  }
  else {
    for(var body of currentSystem.bodies) { 
      addNewBodyToCanvas(body);
    }
  }

  var postion = 0;
  for(var body of currentSystem.bodies) {
    addToBodyList(body,postion++);
  }
  stage.draw();

}

function removeSystem()
{
  if(currentSystem==null)
    return;

  var sysname = currentSystem.name;
  currentSystem.clearAllBodies();
  clearBodyList();
  delete systems[sysname];

  var select = document.getElementById("systemName");
  for (var i=0; i<select.length; i++) {
      if (select.options[i].value == sysname)
        select.remove(i);
  }

  var keys = Object.keys(systems);
  if(keys.length>0)
  {
    select.value = keys[0];
    changeSystem();
  }
  
}
  
function init() {

  var newConf = localStorage.getItem("config");
  if(newConf) config = JSON.parse(newConf);

  document.getElementById("footerVersion").innerText = "Version " + version;

  var span = null;
  
  span = document.getElementById("closeConfig");
  span.onclick = hideConfig;

  span = document.getElementById("closeSysConfig");
  span.onclick = hideSysConfig;

  span = document.getElementById("closeBodyAttributes");

  span.onclick = cancelBodyEdit;

  if(demoMode) {
    load();
    start();
  }
}

function detectCollision(o1, o2) {
  var x = o1.x-o2.x;
  var y = o1.y-o2.y;

  return x*x+y*y< (o1.getRadius()+o2.getRadius())*(o1.getRadius()+o2.getRadius());
}

function animationFunction(frame) {
  var bodies = currentSystem.bodies;
  var gbodies = currentSystem.gbodies;
  collisionManagement(bodies, detectCollision, stop);
  if(animationOn)
  {

    for(var i=0;i<bodies.length;i++)
      bodies[i].prepareForInteract();

    interaction(bodies);

    for(var b=0;b<bodies.length;b++)
    {
      bodies[b].move();
      refresh(gbodies[b],bodies[b]);
    }
  }
}

var anim = new Konva.Animation(animationFunction, layer);

init();



