import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

var Konva = require('konva');
const smalltalk = require('smalltalk');

var configModule = require('./config.js');
var bodyModule = require('./body.js');
var utilModule = require('./util.js');
var physModule = require('./phys');
var  gravInteract = require('./grav').gravInteract;

var Body = bodyModule.Body;
var System = bodyModule.System;
var enableElem = utilModule.enableElem;
var setCheckBox = utilModule.setCheckBox;

var version = "0.3.0-alpha";

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

var systems = {};
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


var appStatus = {
  animationOn: false,
  inAddNew: false,
  inEdit: false,
  inConfig: false,
  currentSystem: null,
  configuration: new configModule.Configuration(),
  isEditing : function() { return this.inAddNew || this.inEdit; }
}

function setAnimation(on) {
  appStatus.animationOn = on;

  var btns = document.getElementsByClassName('toolbar-edit-btn');
  for (let btn of btns)
    enableElem(btn, !appStatus.animationOn);

  btns = document.getElementsByClassName('body-list-button');
  for (let btn of btns) {
    enableElem(btn, !appStatus.animationOn);
  }

  btns = document.getElementsByClassName('sys-edit-btn');
  for (let btn of btns) {
    enableElem(btn, !appStatus.animationOn);
  }

}

function start() {
    if(!appStatus.animationOn)
    {
      setAnimation(true);
      anim.start();
    }
}

function stop() {
  setAnimation(false);
  anim.stop();
}

function reset() {
  for(var i=0;i<appStatus.currentSystem.bodies.length;i++) {
    appStatus.currentSystem.bodies[i].reset();
    appStatus.currentSystem.gbodies[i].body.x(appStatus.currentSystem.bodies[i].x);
    appStatus.currentSystem.gbodies[i].body.y(appStatus.currentSystem.bodies[i].y);
    if(appStatus.currentSystem.gbodies[i].spd) appStatus.currentSystem.gbodies[i].spd.points([0,0,0,0]);
    if(appStatus.currentSystem.gbodies[i].acc) appStatus.currentSystem.gbodies[i].acc.points([0,0,0,0]);
    refreshBodyData(appStatus.currentSystem.bodies[i]);
  }
  stage.draw();
}
  
function cancelBodyEdit() {
  appStatus.inAddNew = false;
  appStatus.inEdit = false;

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

  if(appStatus.inAddNew) {
    var attr = {index: appStatus.currentSystem.bodies.length
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

  if(appStatus.inEdit) {
    var attr = {
      density: density
      ,radius: radius
      ,motionless: motionless
    };
    var body = editBody(attr);
    if(body!=null)
      refreshBodyData(body);
  }

  cancelBodyEdit();

  stage.draw();
  
}

function createNewBody(attributes) {
  var body1 = new Body(attributes, world, appStatus.configuration);
  appStatus.currentSystem.bodies.push(body1);
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


  if(appStatus.configuration.shadow) {
    grpbody1.shadowEnabled(true);
    grpbody1.shadowColor('black');
    grpbody1.shadowOffset({x: 2, y: 2});
    grpbody1.shadowBlur(10);
  }

  layer.add(grpbody1);

  var acc1 = null;
  acc1 = new Konva.Line({
    points: [0,0,0,0],
    stroke: appStatus.configuration.accColor,
    draggable: false
  });
  layer.add(acc1);
  acc1.visible(appStatus.configuration.accelVisible);
    

  var spd1 = null;
  spd1 = new Konva.Line({
    points: [0,0,0,0],
    stroke: appStatus.configuration.spdColor,
    draggable: false
  });
  layer.add(spd1);
  spd1.visible(appStatus.configuration.speedVisible);

  appStatus.currentSystem.gbodies.push({body:grpbody1,acc:acc1,spd:spd1});
  


  grpbody1.on("dragend", function()
  {
    var graphbody = arguments[0].target;
    var x = graphbody.x();
    var y = graphbody.y();

    var index = appStatus.currentSystem.gbodies.findIndex( (elem) => elem.body == graphbody );
    var body = appStatus.currentSystem.bodies[index];
    body.setNewPos(x,y,!appStatus.animationOn);

    document.getElementById("x" + body.index).innerText = Math.floor(x);
    document.getElementById("y" + body.index).innerText = Math.floor(y);

  }); 
  refreshButtons();
}

function editBody(attr) {

  if(currentEditId==-1)
    return null;

  var body = appStatus.currentSystem.bodies[currentEditId];
  body.setAttributes(attr);

  var graphbody = appStatus.currentSystem.gbodies[currentEditId].body;

  graphbody.radius(attr.radius);

  currentEditId = -1;
  cancelBodyEdit();
  refreshButtons();
  return body;
}

function refreshButtons() {
  enableElem("startBtn",appStatus.currentSystem.bodies.length>0);
  enableElem("stopBtn", appStatus.currentSystem.bodies.length>0);
  enableElem("saveBtn", appStatus.currentSystem.bodies.length>0);
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
  cell5.innerHTML = `<button id="removeBtn${postion}" class="body-list-button"><i class="fa fa-trash"></button>`;
  cell5.innerHTML += `&nbsp;<button id="changeBtn${postion}" class="body-list-button"><i class="fa fa-pencil-square" aria-hidden="true"></i></button>`;


  document.getElementById(`removeBtn${postion}`).onclick=function() { remove(postion, body.id) };
  document.getElementById(`changeBtn${postion}`).onclick=function() { change(postion, body.id) };

}


function clearBodyList() {
  var rows = document.getElementsByClassName('bodyrow');
  var rowIds = [];
  for(var i=0;i<rows.length;i++)
  {
    rowIds.push(rows[i].rowIndex);
  }

  rowIds.forEach((i)=>document.getElementById("tbbodies").deleteRow(0));
}




function change(position, id) {
  var idx = -1;
  for(var b=0;b<appStatus.currentSystem.bodies.length;b++)
  {
    if(appStatus.currentSystem.bodies[b].id === id)
      idx = b;
  }

  if(idx==-1)
    return;

  currentEditId = idx;

  var body = appStatus.currentSystem.bodies[idx];
  var attr = body.getAttributes();

  var gphbody = appStatus.currentSystem.gbodies[idx].body;


  var modalHeaderCaption = document.getElementById('modalHeaderCaption');
  modalHeaderCaption.innerText = "Edit Body";

  var modal = document.getElementById("bodyattributes");
  modal.style.display = "block";
  appStatus.inEdit = true;
  enableElem("startBtn",false);
  enableElem("stopBtn", false);


  document.getElementById("inRadius").value = attr.radius;
  document.getElementById("inAx").value = attr.ax;
  document.getElementById("inAy").value  = attr.ay;
  document.getElementById("inDx").value = attr.dx;
  document.getElementById("inDy").value = attr.dy;
  document.getElementById("inDensity").value = attr.density;
  document.getElementById("inColor").value = gphbody.fill();
  utilModule.setCheckBox("inMotionless",attr.motionless);

  enableElem("inColor", false);
  enableElem("inAx", false);
  enableElem("inAy", false);
  enableElem("inDx", false);
  enableElem("inDy", false);


}

function remove(position, id) {
  if(appStatus.currentSystem.bodies.length===0)
    return;

  var row = document.getElementById('row'+position);

  if(row) {
    var i = row.rowIndex;
    document.getElementById("bodies").deleteRow(i);
  }

  var idx = 0;

  for(var b=0;b<appStatus.currentSystem.bodies.length;b++)
  {
    if(appStatus.currentSystem.bodies[b].id === id)
      idx = b;
  }

  var body = appStatus.currentSystem.bodies[0];
  var grpbody = appStatus.currentSystem.gbodies[0];
  if(appStatus.currentSystem.bodies.length>1) {
    body = appStatus.currentSystem.bodies.splice(idx,1)[0];
    grpbody = appStatus.currentSystem.gbodies.splice(idx,1)[0];
  }
  else {
    appStatus.currentSystem.bodies = [];
    appStatus.currentSystem.gbodies = [];
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

  function callback() {
    if(appStatus.currentSystem==null)
      return;

    var modalHeaderCaption = document.getElementById('modalHeaderCaption');
    modalHeaderCaption.innerText = "New Body";

    var modal = document.getElementById("bodyattributes");
    modal.style.display = "block";
    appStatus.inAddNew = true;
    enableElem("startBtn",false);
    enableElem("stopBtn", false);

    enableElem("inColor", true);
    enableElem("inAx", true);
    enableElem("inAy", true);
    enableElem("inDx", true);
    enableElem("inDy", true);
  }

  if(Object.keys(systems).length==0)
    newSystem(callback);
  else
    callback();

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


  if(grpbody.spd) 
    grpbody.spd.points([x,y, x+body.dx * appStatus.configuration.displayFactorSpeed, y+body.dy * appStatus.configuration.displayFactorSpeed]);
  if(grpbody.acc) 
    grpbody.acc.points([x,y, x+body.ax * appStatus.configuration.displayFactorAccel, y+body.ay * appStatus.configuration.displayFactorAccel]);
}

function load() {
  clearBodyList();

  var added = false;
  var select = document.getElementById('systemName');
  var n = select.options.length;
  for (var i=0; i<n; i++) {
    select.remove(0);
  }

  var initSystems = JSON.parse(localStorage.getItem('systems'));
  
  if(demoMode)
    initSystems = demoSystems;
  if(initSystems) {  
    var systemNameSel = document.getElementById('systemName');
    
    for(var sysname in initSystems) {
      var option = document.createElement("option");
      option.text = sysname;
      systemNameSel.add(option);
      added = true;
    }

    for(var sysname in initSystems) {
      var initSystem = initSystems[sysname];

      systems[sysname] = new System(sysname, appStatus.configuration);
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

    var attr = systems[sysname].getAttributes();

    saveSystems[sysname] = { 
      config: systems[sysname].config,
      bodiesAttr: attr
    };
  }
  localStorage.setItem("systems", JSON.stringify(saveSystems));
}


function newSystem(callback)
{
  var sysname = 'System' + Object.keys(systems).length;

  smalltalk
  .prompt('Question', 'Enter new System name', sysname)
  .then((value) => {
      sysname = value;
      if(sysname) {
        var systemNameSel = document.getElementById('systemName');
        var option = document.createElement("option");
        option.text = sysname;
        option.selected = true;
        systemNameSel.add(option);
        var newSystem = new System(sysname, appStatus.configuration);
        systems[sysname] = newSystem;
        changeSystem();
        if(typeof callback=="function")
          callback();
      }
    
  })
  .catch((err) => {
      console.log('newSystem cancel ' + err);
  });
}

function changeSystem()
{
  clearBodyList();
  if(typeof appStatus.currentSystem != "undefined" && appStatus.currentSystem != null) {
    appStatus.currentSystem.clearAllBodies();
    stage.draw();
  }

  var systemName = document.getElementById('systemName').value;
  appStatus.currentSystem = systems[systemName];

  if(typeof appStatus.currentSystem == "undefined" || appStatus.currentSystem == null)
    return;

  if(appStatus.currentSystem.bodiesAttr.length>0) {
    for(var conf of appStatus.currentSystem.bodiesAttr) {
      var body = createNewBody(conf);  
      addNewBodyToCanvas(body);
    }
    appStatus.currentSystem.bodiesAttr = [];
  }
  else {
    for(var body of appStatus.currentSystem.bodies) { 
      addNewBodyToCanvas(body);
    }
  }

  var postion = 0;
  for(var body of appStatus.currentSystem.bodies) {
    addToBodyList(body,postion++);
  }
  stage.draw();

}

function removeSystem()
{
  if(appStatus.currentSystem==null)
    return;

  var sysname = appStatus.currentSystem.name;
  appStatus.currentSystem.clearAllBodies();
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
  if(newConf) 
    appStatus.configuration = new configModule.Configuration(JSON.parse(newConf));

  document.getElementById("footerVersion").innerText = "Version " + version;

  var span = null;
  
  span = document.getElementById("closeConfig");
  span.onclick = function() {configModule.hideConfig(appStatus);};

  span = document.getElementById("closeSysConfig");
  span.onclick = function(){configModule.hideSysConfig(appStatus)};

  document.getElementById('closeSysConfigBtn').onclick=function() {
      configModule.closeSysConfig(appStatus);
      updateAllSystems();
    };
  document.getElementById('resetSysConfigBtn').click=function() {
    configModule.resetSysConfig(appStatus);
    updateAllSystems();
  };

  document.getElementById('closeConfigBtn').onclick=function() {
    configModule.closeConfig(appStatus);
    updateAllSystems();
  };

  document.getElementById('resetConfigBtn').onclick=function() {
    configModule.resetConfig(appStatus);
    updateAllSystems();
  };

  document.getElementById('showConfigBtn').onclick = function() { configModule.showConfig(appStatus)};
  document.getElementById('showSysConfigBtn').onclick = function() {configModule.showSysConfig(appStatus);};


  span = document.getElementById("closeBodyAttributes");
  span.onclick = cancelBodyEdit;

  document.getElementById('addNewBtn').onclick = addNew;
  document.getElementById('resetBtn').onclick =  reset;
  document.getElementById('loadBtn').onclick =  load;
  document.getElementById('saveBtn').onclick =  save;
  document.getElementById('startBtn').onclick =  start;
  document.getElementById('stopBtn').onclick =  stop;

  document.getElementById('newSystemBtn').onclick=newSystem;
  document.getElementById('removeSystemBtn').onclick=removeSystem;

  document.getElementById('systemName').onchange=changeSystem;

  document.getElementById('confirmBodyEditBtn').onclick=confirmBodyEdit;
  document.getElementById('cancelBodyEditBtn').onclick=cancelBodyEdit;

  tippy('#showConfigBtn', {
    content: 'Open Config Dialog',
  });

  tippy('#addNewBtn', {
    content: 'Add New Body',
  });

  tippy('#loadBtn', {
    content: 'Load Systems from localstorage',
  });
  
  tippy('#saveBtn', {
    content: 'Save Systems to localstorage',
  });

  tippy('#startBtn', {
    content: 'Start animation',
  });
  
  tippy('#stopBtn', {
    content: 'Stop animation',
  });

  tippy('#resetBtn', {
    content: 'Reset bodies position',
  });

  tippy('#newSystemBtn', {
    content: 'Create new system',
  });
  tippy('#removeSystemBtn', {
    content: 'Delete current system',
  });
  tippy('#showSysConfigBtn', {
    content: 'Show System config',
  });
  
  if(demoMode) {
    load();
    start();
  }
}

function updateAllSystems() {

  appStatus.currentSystem.gbodies.forEach(
    (elem) => {
      elem.acc.visible(appStatus.configuration.accelVisible);
      elem.spd.visible(appStatus.configuration.speedVisible);
    }
  );
}



function detectCollision(o1, o2) {
  var x = o1.x-o2.x;
  var y = o1.y-o2.y;

  return x*x+y*y< (o1.getRadius()+o2.getRadius())*(o1.getRadius()+o2.getRadius());
}

function animationFunction(frame) {
  var bodies = appStatus.currentSystem.bodies;
  var gbodies = appStatus.currentSystem.gbodies;
  physModule.collisionManagement(bodies, detectCollision, stop);
  if(appStatus.animationOn)
  {

    for(var i=0;i<bodies.length;i++)
      bodies[i].prepareForInteract();

      physModule.interaction(bodies, appStatus.configuration, gravInteract);

    for(var b=0;b<bodies.length;b++)
    {
      bodies[b].move();
      refresh(gbodies[b],bodies[b]);
    }
  }
}

var anim = new Konva.Animation(animationFunction, layer);

init();



