//import { app } from 'electron/main';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import './style.css';

const Handlebars = require('handlebars');
const Konva = require('konva');
const smalltalk = require('smalltalk');
const $ = require( "jquery" );

const configModule = require('./config.js');
const bodyModule = require('./body.js');
const utilModule = require('./util.js');
const physModule = require('./phys');
const interactionModuleChase = require('./models/chase'); // require('./grav');
const interactionModuleGrav = require('./models/grav'); // require('./grav');

const version = "0.4.0-alpha";

// Aliases
var Body = bodyModule.Body;
var System = bodyModule.System;
var enableElem = utilModule.enableElem;


// Physical mode loading
var interactionModule = interactionModuleGrav;
var demoMode = false;

if(window.location.search) {

  var qpos = window.location.search.indexOf('?');
  if(qpos>-1) {
    var parts = window.location.search.substring(qpos+1).split('&');
    parts.forEach((part)=> {
      var subs = part.split('=');
      if(subs.length==1) {
        if(subs[0].trim()=="demo")
          demoMode = true;
      } else {
        switch(subs[0].trim()) {
          case "i":
            switch(subs[1].trim()) {
              case "chase":
                interactionModule = interactionModuleChase;
                break;
            }
        }
      }
    });
  }

  //demoMode = window.location.search.indexOf('demo')>=0;
}

// Aliases
const interactFunction = interactionModule.interactFunction;
const extraConfigurationUI = interactionModule.extraConfigurationRows;
const extraSysConfUI = interactionModule.extraSystemConfRows;

/** A named collection of System() instances */
var systems = {};
/** Body index under edit in current system */
var currentBodyIndexUnderEdit = -1;

var world = { width: window.innerWidth,  height: window.innerHeight /*-10*/ };
//var world = { width: 3000,  height: 2000 };

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
  var containerHeight = container.offsetHeight;
  // to do this we need to scale the stage
  //var scale = containerWidth / world.width;

  stage.width( containerWidth /* world.width * scale*/);
  stage.height(containerHeight);

  world.width = containerWidth;
  world.height = containerHeight;

  //stage.scale({ x: scale, y: scale });
  stage.draw();

  centerX = stage.getWidth() / 2;
  centerY = stage.getHeight() / 2;

}

fitStageIntoParentContainer();
// adapt the stage on any window resize
window.addEventListener('resize', fitStageIntoParentContainer);

var demoSystems = interactionModule.buildDemoSystems(centerX, centerY);

var appStatus = {
  animationOn: false,
  inAddNew: false,
  inEdit: false,
  inConfig: false,
  currentSystem: null,
  configuration: new configModule.Configuration(),
  moduleConfig : [],
  isEditing : function() { return this.inAddNew || this.inEdit; }
}

appStatus.moduleConfig = interactionModule.moduleConfig;
appStatus.moduleConfig.forEach((elem)=>{
  appStatus.configuration[elem.propDefName] = elem.defValue; 
});

var bodyrow_templateHtml = $("#bodyrow-template").html();
var bodyrow_template = Handlebars.compile(bodyrow_templateHtml);


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
    resetDone = false;
}

function stop() {
  setAnimation(false);
  anim.stop();
}

var resetDone = true;

function reset() {
  for(var i=0;i<appStatus.currentSystem.bodies.length;i++) {
    appStatus.currentSystem.bodies[i].reset();
    appStatus.currentSystem.gbodies[i].body.x(appStatus.currentSystem.bodies[i].x);
    appStatus.currentSystem.gbodies[i].body.y(appStatus.currentSystem.bodies[i].y);
    if(appStatus.currentSystem.gbodies[i].spd) appStatus.currentSystem.gbodies[i].spd.points([0,0,0,0]);
    if(appStatus.currentSystem.gbodies[i].acc) appStatus.currentSystem.gbodies[i].acc.points([0,0,0,0]);
    refreshDisplayedBodyData(appStatus.currentSystem.bodies[i]);
  }
  stage.draw();
  resetDone = true;
}
  
function confirmBodyEdit() {

  var radius = Number($("#inRadius").val());
  var density = Number($("#inDensity").val());
  var color = $("#inColor").val();
  var motionless = document.getElementById("inMotionless").checked==true;

  var ax = 0;
  var ay = 0;
  var dx = 0;
  var dy = 0;


  if(appStatus.inAddNew) {

    ax = Number($("#inAxIni").val());
    ay = Number($("#inAyIni").val());
    dx = Number($("#inDxIni").val());
    dy = Number($("#inDyIni").val());
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

    var attr = null;

    if(resetDone) {

      ax = Number($("#inAxIni").val());
      ay = Number($("#inAyIni").val());
      dx = Number($("#inDxIni").val());
      dy = Number($("#inDyIni").val());

      attr = {
        density: density, radius: radius, motionless: motionless
        , _ax: ax, _ay: ay, _dx: dx, _dy: dy
      };
    } else {

      ax = Number($("#inAx").val());
      ay = Number($("#inAy").val());
      dx = Number($("#inDx").val());
      dy = Number($("#inDy").val());

      attr = {
        density: density, radius: radius, motionless: motionless
        , ax: ax, ay: ay, dx: dx, dy: dy
      };
  
    }

    var body = editBody(attr);
    if(body!=null)
      refreshDisplayedBodyData(body);
  }
  cancelBodyEdit();
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
  //setCheckBox("inMotionless", false);
  $("inMotionless").prop("checked", false);

  enableElem("inColor",true);
  enableElem("inAx",true);
  enableElem("inAy",true);
  enableElem("inDx",true);
  enableElem("inDy",true);

  
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
  


  grpbody1.on("dragend", function() {
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

  if(currentBodyIndexUnderEdit==-1)
    return null;

  var body = appStatus.currentSystem.bodies[currentBodyIndexUnderEdit];
  body.setAttributes(attr);

  var graphbody = appStatus.currentSystem.gbodies[currentBodyIndexUnderEdit].body;

  graphbody.radius(attr.radius);

  currentBodyIndexUnderEdit = -1;
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
  /*
  var cell1 = row.insertCell(0); 
  var cell2 = row.insertCell(1);
  var cell3 = row.insertCell(2);
  var cell4 = row.insertCell(3);
  var cell5 = row.insertCell(4); //cell5.style = "width: 10%";
  */

  // Add some text to the new cells:
  
  /*
  var templateHtml = `<td><span style="color: {{color}};" class="{{className}}">{{postion}}</span>`;
  templateHtml += `<td>(<span id="x{{postion}}">{{x}}</span>,<span id="y{{postion}}">{{y}}</span>)`;
  templateHtml += `<td>(<span id="sx{{postion}}">{{dx}}</span>,<span id="sy{{postion}}">{{dy}}</span>)`;
  templateHtml += `<td>(<span id="ax{{postion}}">{{ax}}</span>,<span id="ay{{postion}}">{{ay}}</span>)`;
  templateHtml += `<td><button id="removeBtn{{postion}}" class="body-list-button"><i class="fa fa-trash"></button>`;
  templateHtml += `<td><button id="changeBtn{{postion}}" class="body-list-button"><i class="fa fa-pencil-square" aria-hidden="true"></i></button>`;
  */
  

  var params = {
    color: body.color,
    postion: postion,
    className: 'bodyNameInList' + (body.motionless?'Motionless':''),
    x: body._x, y: body._y,
    ax: body._ax, ay: body._ay,
    dx: body._dx, dy: body._dy
  };
  
  //console.log(template(params));
  row.innerHTML = bodyrow_template(params);
/*
  row.appendChild($(`<td><span style="color: ${color};" class="bodyNameList${body.motionless?'Motionless':''}">${postion}</span></td>`)[0]);
  row.appendChild($(`<td>(<span id="x${postion}">${body._x}</span>,<span id="y${postion}">${body._y}</span>)</td>`)[0]);
  row.appendChild($(`<td>(<span id="sx${postion}">${body._dx}</span>,<span id="sy${postion}">${body._dy}</span>)</td>`)[0]);
  row.appendChild($(`<td>(<span id="ax${postion}">${body._ax}</span>,<span id="ay${postion}">${body._ay}</span>)</td>`)[0]);
  row.appendChild($(`<td><button id="removeBtn${postion}" class="body-list-button"><i class="fa fa-trash"></button></td>`)[0]);
  row.appendChild($(`<td><button id="changeBtn${postion}" class="body-list-button"><i class="fa fa-pencil-square" aria-hidden="true"></i></button></td>`)[0]);
*/
  $(`#removeBtn${postion}`).on("click", function() {remove(postion, body.id)});
  $(`#changeBtn${postion}`).on("click", function() {change(postion, body.id)});

}

function clearBodyList() {
  var rows = document.getElementsByClassName('bodyrow');
  var rowIds = [];
  for(var i=0;i<rows.length;i++) {
    rowIds.push(rows[i].rowIndex);
  }
  rowIds.forEach((i)=>document.getElementById('tbbodies').deleteRow(0));
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

  currentBodyIndexUnderEdit = idx;

  var body = appStatus.currentSystem.bodies[idx];
  var attr = body.getAttributes();

  var gphbody = appStatus.currentSystem.gbodies[idx].body;


  $('#modalHeaderCaption').text("Edit Body");


  if(resetDone) {
    showInitBodyAttr(true);
    showBodyAttr(false);

  } else  {
    showInitBodyAttr(false);
    showBodyAttr(true);
  }


  document.getElementById("inRadius").value = attr.radius;
  document.getElementById("inAx").value = attr.ax;
  document.getElementById("inAy").value  = attr.ay;
  document.getElementById("inDx").value = attr.dx;
  document.getElementById("inDy").value = attr.dy;

  document.getElementById("inAxIni").value = attr._ax;
  document.getElementById("inAyIni").value  = attr._ay;
  document.getElementById("inDxIni").value = attr._dx;
  document.getElementById("inDyIni").value = attr._dy;


  document.getElementById("inDensity").value = attr.density;
  document.getElementById("inColor").value = gphbody.fill();
  //utilModule.setCheckBox("inMotionless",attr.motionless);
  $('#nMotionless').prop("inMotionless", attr.motionless)

  enableElem("inColor", false);
  /*
  enableElem("inAx", false);
  enableElem("inAy", false);
  enableElem("inDx", false);
  enableElem("inDy", false);
  */

 var modal = document.getElementById("bodyattributes");
 modal.style.display = "block";
 appStatus.inEdit = true;
 enableElem("startBtn",false);
 enableElem("stopBtn", false);



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

function showInitBodyAttr(show)
{
  if(show)
    $('.init-body-attr').removeClass('hide').addClass('show');
  else
    $('.init-body-attr').removeClass('show').addClass('hide');
}

function showBodyAttr(show)
{
  if(show)
    $('.body-attr').removeClass('hide').addClass('show');
  else
    $('.body-attr').removeClass('show').addClass('hide');
}


function addNew() {

  function callback() {
    if(appStatus.currentSystem==null)
      return;

    $('#modalHeaderCaption').text("New Body");

    showInitBodyAttr(true);
    showBodyAttr(false);


    enableElem("startBtn",false);
    enableElem("stopBtn", false);

    enableElem("inColor", true);
    enableElem("inAxIni", true);
    enableElem("inAyIni", true);
    enableElem("inDxIni", true);
    enableElem("inDyIni", true);

    var modal = document.getElementById("bodyattributes");
    modal.style.display = "block";
    appStatus.inAddNew = true;

  }

  if(Object.keys(systems).length==0)
    newSystem(callback);
  else
    callback();

}

function refreshDisplayedBodyData(body) {

  document.getElementById("x" + body.index).innerText = Math.floor(body.x);
  document.getElementById("y" + body.index).innerText = Math.floor(body.y);

  document.getElementById("sx" + body.index).innerText = Number(body.dx).toFixed(3);
  document.getElementById("sy" + body.index).innerText = Number(body.dy).toFixed(3);

  document.getElementById("ax" + body.index).innerText = Number(body.ax).toFixed(3);
  document.getElementById("ay" + body.index).innerText = Number(body.ay).toFixed(3);   

}




function loadSystemsFromLocalStorage() {
  var initSystems = JSON.parse(localStorage.getItem(interactionModule.interactionName +'/systems'));
  doLoad(initSystems);
}

function doLoad(initSystems) {
  clearBodyList();

  var added = false;
  var select = document.getElementById('systemName');
  var n = select.options.length;
  for (var i=0; i<n; i++) {
    select.remove(0);
  }

 
  
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

      systems[sysname] = new System(sysname, appStatus.configuration, appStatus.moduleConfig);
      systems[sysname].bodiesAttr = initSystem.bodiesAttr;
      systems[sysname].config =  initSystem.config;
    }

    if(added)
      changeSystem();
    stage.draw();
  }
}
    
function saveSystemToLocalStorage() {

  var saveSystems = {};

  for(var sysname in systems) {
    saveSystems[sysname] = systems[sysname].toJSON();
  }
  localStorage.setItem( interactionModule.interactionName + "/systems", JSON.stringify(saveSystems));
}


function newSystem(callback) {
  var sysname = 'System' + String(Object.keys(systems).length+1);

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
        var newSystem = new System(sysname, appStatus.configuration, appStatus.moduleConfig) ; 
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

/**
 * Event handler, change the current system after it has been selected in the combobox.
 */
function changeSystem() {
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

/**
 * Event handler, change the current system after the previous current system has been deleted.
 * @returns 
 */
function removeSystem() {
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

function downloadCurrentSystem() {
  if(appStatus.currentSystem==null)
    return;

  var sysData = {};
  sysData[appStatus.currentSystem.name]  = appStatus.currentSystem.toJSON();
  
  exportJSON(JSON.stringify(sysData)
    , appStatus.currentSystem.name + '.json'
    , 'text/json');
  
}


function readSingleFile(e) {

  function useFileContents(contents) {
    doLoad(JSON.parse(contents));
  }

  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    useFileContents(contents);
  };
  reader.readAsText(file);
  document.getElementById('file-input').style="display:none";
}


function startSystemUpload() {
  document.getElementById('file-input').style="display:block";
}
  
function initGraphicElemnts() {
  
  var newConf = localStorage.getItem("config");
  if(newConf) 
    appStatus.configuration = new configModule.Configuration(JSON.parse(newConf));

  document.getElementById("footerVersion").innerText = "Version " + version;

  var span = document.getElementById("closeConfig");
  span.onclick = function() {configModule.hideConfig(appStatus);};

  span = document.getElementById("closeSysConfig");
  span.onclick = function(){configModule.hideSysConfig(appStatus)};

  document.getElementById('closeSysConfigBtn').onclick=function() {
      configModule.closeSysConfig(appStatus);
      updateCurrentSystemGrpBodies();
    };
  document.getElementById('resetSysConfigBtn').click=function() {
    configModule.resetSysConfig(appStatus);
    updateCurrentSystemGrpBodies();
  };

  document.getElementById('closeConfigBtn').onclick=function() {
    configModule.closeConfig(appStatus);
    updateCurrentSystemGrpBodies();
  };

  document.getElementById('resetConfigBtn').onclick=function() {
    configModule.resetConfig(appStatus);
    updateCurrentSystemGrpBodies();
  };

  document.getElementById('showConfigBtn').onclick = function() { configModule.showConfig(appStatus)};
  document.getElementById('showSysConfigBtn').onclick = function() {configModule.showSysConfig(appStatus);};


  span = document.getElementById("closeBodyAttributes");
  span.onclick = cancelBodyEdit;

  $('#addNewBtn').on("click", addNew);
  $('#resetBtn').on("click", reset);
  $('#loadBtn').on("click", loadSystemsFromLocalStorage);
  $('#saveBtn').on("click", saveSystemToLocalStorage);
  $('#startBtn').on("click", start);
  $('#stopBtn').on("click", stop);

  $('#newSystemBtn').on("click", newSystem);
  $('#removeSystemBtn').on("click", removeSystem);

  document.getElementById('systemName').onchange=changeSystem;

  $('#confirmBodyEditBtn').on("click", confirmBodyEdit);
  $('#cancelBodyEditBtn').on("click", cancelBodyEdit);

  $('#downloadSysBtn').on("click", downloadCurrentSystem);
  $('#uploadSysBtn').on("click", startSystemUpload);


  if(extraConfigurationUI!=null && extraConfigurationUI.length>0) {
    var confTableBody = document.getElementById("configTableBody");
    extraConfigurationUI.forEach((rowHtml) => {
      var row = confTableBody.insertRow(confTableBody.length);
      row.innerHTML = rowHtml; 
    });
  }

  if(extraSysConfUI!=null && extraSysConfUI.length>0) {
    var confTableBody = document.getElementById("configSysTableBody");
    extraSysConfUI.forEach((rowHtml) => {
      var row = confTableBody.insertRow(confTableBody.length);
      row.innerHTML = rowHtml; 
    });
  }

  $('#interactionName').text(interactionModule.interactionTitle);

  document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);

  // TODO: use attribute data-tippy-content="Open Config Dialog" instead
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

  tippy('#downloadSysBtn', {
    content: 'Export system data',
  });
  tippy('#uploadSysBtn', {
    content: 'Import system data',
  });
  
  if(demoMode) {
    loadSystemsFromLocalStorage();
    start();
  }
}

/**
 * Update all current system graphical bodies after some changes, for example after a change in the configuration.
 */
function updateCurrentSystemGrpBodies() {

  appStatus.currentSystem.gbodies.forEach(
    (elem) => {
      elem.acc.visible(appStatus.configuration.accelVisible);
      elem.spd.visible(appStatus.configuration.speedVisible);
    }
  );
}


function exportJSON(data, filename, type) {
  var file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
  else { // Others
      var a = document.createElement("a"),
              url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);  
      }, 0); 
  }
}



function animationFunction(frame) {

  function refreshGrpBodyData(grpbody,body) {

    refreshDisplayedBodyData(body);
  
    var x = body.x;
    var y = body.y;
  
    grpbody.body.x(x);
    grpbody.body.y(y);
  
  
    if(grpbody.spd) 
      grpbody.spd.points([x,y, x+body.dx * appStatus.configuration.displayFactorSpeed, y+body.dy * appStatus.configuration.displayFactorSpeed]);
    if(grpbody.acc) 
      grpbody.acc.points([x,y, x+body.ax * appStatus.configuration.displayFactorAccel, y+body.ay * appStatus.configuration.displayFactorAccel]);
  }

  var bodies = appStatus.currentSystem.bodies;
  var gbodies = appStatus.currentSystem.gbodies;
  physModule.collisionManagement(bodies, stop);
  if(appStatus.animationOn)
  {

    for(var i=0;i<bodies.length;i++)
      bodies[i].prepareForInteract();

    physModule.interaction(bodies, appStatus.configuration, appStatus.currentSystem.config, interactFunction);

    for(var b=0;b<bodies.length;b++)
    {
      bodies[b].move(world);
      refreshGrpBodyData(gbodies[b],bodies[b]);
    }
  }
}

var anim = new Konva.Animation(animationFunction, layer);

initGraphicElemnts();



