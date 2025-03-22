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
const interactionModuleChase = require('./models/chase');
const interactionModuleGrav = require('./models/grav');
const GraphicEnvironment = require('./graphics').GraphicEnvironment;

const version = "0.6.0-alpha";

const BODYROW_CLASSNAME = 'bodyrow';

// Aliases
const Body = bodyModule.Body;
const System = bodyModule.System;
const enableElem = utilModule.enableElem;
const setCheckBox = utilModule.setCheckBox;


// Physical module loading
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
}

// Aliases
const moduleConfigDefinition = interactionModule.moduleConfigDefinition;

/** A named collection of System() instances */
var systems = {};
/** Body index under edit in current system */
var currentBodyIndexUnderEdit = -1;

const graphicEnvironment = new GraphicEnvironment(window);

graphicEnvironment.fitStageIntoParentContainer();
// adapt the stage on any window resize
window.addEventListener('resize', function() { graphicEnvironment.fitStageIntoParentContainer()});

const demoSystems = interactionModule.buildDemoSystems(graphicEnvironment.centerX, graphicEnvironment.centerY);

function ApplicationStatus() {

  this.animationOn = false;
  this.inAddNew = false;
  this.inEdit = false;
  this.inConfig = false;
  this.currentSystem = null;
  this.currentConfiguration = null;
  this.interactionName = "";
  this.modulePropertyDefinitions = [];

  this.isEditing = function() { 
    return this.inAddNew || this.inEdit; 
  }

  this.setAnimation = function (on) {
    appStatus.animationOn = on;
  
    $('.toolbar-edit-btn').prop('disabled', appStatus.animationOn);
    $('.body-list-button').prop('disabled', appStatus.animationOn);
    $('.sys-edit-btn').prop('disabled', appStatus.animationOn);

  }
}



const appStatus = new ApplicationStatus();

appStatus.modulePropertyDefinitions = interactionModule.moduleConfigDefinition;

appStatus.currentConfiguration = new configModule.Configuration(null, appStatus.modulePropertyDefinitions);

appStatus.interactionName = interactionModule.interactionName;


var bodyrow_templateHtml = $("#bodyrow-template").html();
var bodyrow_template = Handlebars.compile(bodyrow_templateHtml);




function startAnimation() {
    if(!appStatus.animationOn)
    {
      appStatus.setAnimation(true);
      anim.start();
    }
    resetDone = false;
}

function stopAnimation() {
  appStatus.setAnimation(false);
  anim.stop();
}

var resetDone = false;

function reset() {
  for(var i=0;i<appStatus.currentSystem.bodies.length;i++) {
    appStatus.currentSystem.bodies[i].reset();
    appStatus.currentSystem.gbodies[i].body.x(appStatus.currentSystem.bodies[i].x);
    appStatus.currentSystem.gbodies[i].body.y(appStatus.currentSystem.bodies[i].y);
    if(appStatus.currentSystem.gbodies[i].spd) appStatus.currentSystem.gbodies[i].spd.points([0,0,0,0]);
    if(appStatus.currentSystem.gbodies[i].acc) appStatus.currentSystem.gbodies[i].acc.points([0,0,0,0]);
    refreshDisplayedBodyData(appStatus.currentSystem.bodies[i]);
  }
  graphicEnvironment.stage.draw();
  resetDone = true;
}
  
function confirmBodyEdit() {

  var radius = Number($("#inRadius").val());
  var density = Number($("#inDensity").val());
  var color = $("#inColor").val();
  //var motionless = $("#inMotionless").prop('checked')==true; jquery doesn't seem to work
  var motionless = document.getElementById("inMotionless").checked==true;

  var x = 0;
  var y = 0;
  var ax = 0;
  var ay = 0;
  var dx = 0;
  var dy = 0;

  if(appStatus.inAddNew) {

    x = Number($("#inPosXIni").val());
    y = Number($("#inPosYIni").val());
    ax = Number($("#inAxIni").val());
    ay = Number($("#inAyIni").val());
    dx = Number($("#inDxIni").val());
    dy = Number($("#inDyIni").val());
    var attr = {index: appStatus.currentSystem.bodies.length
      ,x: graphicEnvironment.centerX, y: graphicEnvironment.centerY
      ,dx: dx, dy: dy
      ,ax: ax, ay: ay
      ,density: density
      ,radius: radius
      ,color: color
      ,motionless: motionless
    };

    var body = new Body(attr, graphicEnvironment.world, appStatus.currentConfiguration);
    appStatus.currentSystem.bodies.push(body);
    addNewBodyToCanvas(body);
    addToBodyList(body, body.index);
  }

  if(appStatus.inEdit) {

    var attr = null;

    if(resetDone) {
      x = Number($("#inPosXIni").val());
      y = Number($("#inPosYIni").val());
      ax = Number($("#inAxIni").val());
      ay = Number($("#inAyIni").val());
      dx = Number($("#inDxIni").val());
      dy = Number($("#inDyIni").val());


      attr = {
        density: density, radius: radius, motionless: motionless
        , _ax: ax, _ay: ay, _dx: dx, _dy: dy
      };
    } else {
      x = Number($("#inPosX").val());
      y = Number($("#inPosY").val());
      ax = Number($("#inAx").val());
      ay = Number($("#inAy").val());
      dx = Number($("#inDx").val());
      dy = Number($("#inDy").val());

      attr = {
        density: density, radius: radius, motionless: motionless,
        x: x, y: y, ax: ax, ay: ay, dx: dx, dy: dy
      };
  
    }

    var body = editBody(attr);
    if(body!=null)
      refreshDisplayedBodyData(body);
  }
  closeBodyEditor();
  graphicEnvironment.stage.draw();
  
}

function closeBodyEditor() {
  appStatus.inAddNew = false;
  appStatus.inEdit = false;

//  var modal = document.getElementById("bodyattributes");
//  modal.style.display = "none";
  $("#bodyattributes").hide();
  $("#inPosX").val("0");
  $("#inPosXIni").val("0");
  $("#inPosY").val("0");
  $("#inPosYIni").val("0");

  $("#inRadius").val("10");
  $("#inAx").val("0");
  $("#inAxIni").val("0");
  $("#inAy").val("0");
  $("#inAyIni").val("0");
  $("#inDx").val("0");
  $("#inDxIni").val("0");
  $("#inDy").val("0");
  $("#inDyIni").val("0");
  $("#inDensity").val("1");
  $("#inColor").val("#FFFFFF");
  setCheckBox("inMotionless", false);
  //$("#inMotionless").prop("checked", false);

  enableElem("inColor",true);
  enableElem("inPosX",true);
  enableElem("inPosY",true);
  enableElem("inAx",true);
  enableElem("inAy",true);
  enableElem("inDx",true);
  enableElem("inDy",true);

}


/**
 * Create a new graphical body (Konva.Circle) base on the physical body passed in
 * @param {*} body the physhical body
 */
function addNewBodyToCanvas(body) {

  var grpbody1 = new Konva.Circle({
  x: body.x, 
  y: body.y,
  radius: body.radius,
  fill: body.color,// '#00D2FF',
  strokeWidth: 0,
  draggable: true,
  });


  if(appStatus.currentConfiguration.shadow) {
    grpbody1.shadowEnabled(true);
    grpbody1.shadowColor('black');
    grpbody1.shadowOffset({x: 2, y: 2});
    grpbody1.shadowBlur(10);
  }

  graphicEnvironment.layer.add(grpbody1);

  var acc1 = null;
  acc1 = new Konva.Line({
    points: [0,0,0,0],
    stroke: appStatus.currentConfiguration.accColor,
    draggable: false
  });
  graphicEnvironment.layer.add(acc1);
  acc1.visible(appStatus.currentConfiguration.accelVisible);
    

  var spd1 = null;
  spd1 = new Konva.Line({
    points: [0,0,0,0],
    stroke: appStatus.currentConfiguration.spdColor,
    draggable: false
  });
  graphicEnvironment.layer.add(spd1);
  spd1.visible(appStatus.currentConfiguration.speedVisible);

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
  if(attr.x) graphbody.x(attr.x);
  if(attr.y) graphbody.y(attr.y);

  currentBodyIndexUnderEdit = -1;
  closeBodyEditor();
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
  row.className = BODYROW_CLASSNAME;

  var params = {
    color: body.color,
    postion: postion,
    className: 'bodyNameInList' + (body.motionless?'Motionless':''),
    x: body._x, y: body._y,
    ax: body._ax, ay: body._ay,
    dx: body._dx, dy: body._dy
  };
 

  row.innerHTML = bodyrow_template(params);

  $(`#removeBtn${postion}`).on("click", function() {remove(postion, body.id)});
  $(`#changeBtn${postion}`).on("click", function() {change(postion, body.id)});

}

function clearBodyList() {
  var rows = document.getElementsByClassName(BODYROW_CLASSNAME);
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

  $("#inRadius").val(attr.radius);
  $("#inPosX").val(attr.x);
  $("#inPosY").val(attr.y);
  $("#inAx").val(attr.ax);
  $("#inAy").val(attr.ay);
  $("#inDx").val(attr.dx);
  $("#inDy").val(attr.dy);

  $("#inAxIni").val(attr._ax);
  $("#inAyIni").val(attr._ay);
  $("#inDxIni").val(attr._dx);
  $("inDyIni").val(attr._dy);

  $("#inDensity").val(attr.density);
  $("#inColor").val(gphbody.fill());

  //$('#inMotionless').prop("checked", attr.motionless);
  utilModule.setCheckBox('inMotionless',attr.motionless);

  enableElem("inColor", false);

 $("#bodyattributes").show();
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

    graphicEnvironment.layer.draw();
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

    $("#bodyattributes").show();
    appStatus.inAddNew = true;

  }

  if(Object.keys(systems).length==0)
    newSystem(callback);
  else
    callback();
}

function refreshDisplayedBodyData(body) {

  $("#x" + body.index).text(Math.floor(body.x));
  $("#y" + body.index).text(Math.floor(body.y));

  $("#sx" + body.index).text(Number(body.dx).toFixed(3));
  $("#sy" + body.index).text(Number(body.dy).toFixed(3));

  $("#ax" + body.index).text(Number(body.ax).toFixed(3));
  $("#ay" + body.index).text(Number(body.ay).toFixed(3));   
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

      systems[sysname] = new System(sysname, appStatus.currentConfiguration);
      systems[sysname].bodiesAttr = initSystem.bodiesAttr;
      systems[sysname].config =  initSystem.config;
    }

    if(added)
      changeSystem();
    graphicEnvironment.stage.draw();
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
        var newSystem = new System(sysname, appStatus.currentConfiguration, appStatus.modulePropertyDefinitions) ; 
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
    graphicEnvironment.stage.draw();
  }

  var systemName = document.getElementById('systemName').value;
  appStatus.currentSystem = systems[systemName];

  if(typeof appStatus.currentSystem == "undefined" || appStatus.currentSystem == null)
    return;

  if(appStatus.currentSystem.bodiesAttr.length>0) {
    for(var conf of appStatus.currentSystem.bodiesAttr) {
      var body = new Body(conf, graphicEnvironment.world, appStatus.currentConfiguration);  
      appStatus.currentSystem.bodies.push(body);
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
  graphicEnvironment.stage.draw();

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

function addPropertyElements(propertyGroupLabel, propertyDefinitions) {
  var confTableBody = document.getElementById("configTableBody");
  if(propertyDefinitions.length>0) {
    var row = confTableBody.insertRow(confTableBody.length);
    row.innerHTML = '<td colspan="2" class="config-section-header"><label>' + propertyGroupLabel +"</label></td>";
  }
  propertyDefinitions.forEach((propDef) => {
    var row = confTableBody.insertRow(confTableBody.length);
    row.innerHTML = '<td><label>' + propDef.labelForDefaultValue + ':</label></td><td><input type=text id="propCurrentVaule_' + propDef.propName  +'" maxlength="' + propDef.maxlength +  '" style="width: 2em"></td>';
  });

  var confTableBody = document.getElementById("configSysTableBody");
  propertyDefinitions.forEach((propDef) => {
    var row = confTableBody.insertRow(confTableBody.length);
    row.innerHTML = '<td><label>' + propDef.labelForSystemValue + ':</label></td><td><input type=text id="propSystemVaue_' + propDef.propName  +'" maxlength="' + propDef.maxlength +  '" style="width: 2em"></td>'; 
  });
}
  
function initGraphicElements() {
  
  var newConf = localStorage.getItem( appStatus.interactionName + "/config");
  if(newConf) 
    appStatus.currentConfiguration = new configModule.Configuration(JSON.parse(newConf), appStatus.modulePropertyDefinitions);

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
  span.onclick =  closeBodyEditor;

  $('#addNewBtn').on("click", addNew);
  $('#resetBtn').on("click", reset);
  $('#loadBtn').on("click", loadSystemsFromLocalStorage);
  $('#saveBtn').on("click", saveSystemToLocalStorage);
  $('#startBtn').on("click", startAnimation);
  $('#stopBtn').on("click", stopAnimation);

  $('#newSystemBtn').on("click", newSystem);
  $('#removeSystemBtn').on("click", removeSystem);

  document.getElementById('systemName').onchange=changeSystem;

  $('#confirmBodyEditBtn').on("click", confirmBodyEdit);
  $('#cancelBodyEditBtn').on("click", closeBodyEditor);

  $('#downloadSysBtn').on("click", downloadCurrentSystem);
  $('#uploadSysBtn').on("click", startSystemUpload);

  addPropertyElements("Physics Configuration", configModule.systemPropertyDefinitions);

  if(moduleConfigDefinition!=null && moduleConfigDefinition.length>0) {
    addPropertyElements(interactionModule.interactionExtraConfigurationLabel, moduleConfigDefinition);
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
    startAnimation();
  }
}

/**
 * Update all current system graphical bodies after some changes, for example after a change in the configuration.
 */
function updateCurrentSystemGrpBodies() {

  appStatus.currentSystem.gbodies.forEach(
    (elem) => {
      elem.acc.visible(appStatus.currentConfiguration.accelVisible);
      elem.spd.visible(appStatus.currentConfiguration.speedVisible);
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
      grpbody.spd.points([x,y, x+body.dx * appStatus.currentConfiguration.displayFactorSpeed, y+body.dy * appStatus.currentConfiguration.displayFactorSpeed]);
    if(grpbody.acc) 
      grpbody.acc.points([x,y, x+body.ax * appStatus.currentConfiguration.displayFactorAccel, y+body.ay * appStatus.currentConfiguration.displayFactorAccel]);
  }

  var bodies = appStatus.currentSystem.bodies;
  var gbodies = appStatus.currentSystem.gbodies;
  physModule.collisionManagement(bodies, stopAnimation);
  if(appStatus.animationOn)
  {

    for(var i=0;i<bodies.length;i++)
      bodies[i].prepareForInteract();

    physModule.interaction(bodies, appStatus.currentConfiguration, appStatus.currentSystem.config, interactionModule.interactFunction);

    for(var b=0;b<bodies.length;b++)
    {
      bodies[b].move(graphicEnvironment.world);
      refreshGrpBodyData(gbodies[b],bodies[b]);
    }
  }
}

var anim = new Konva.Animation(animationFunction, graphicEnvironment.layer);

initGraphicElements();



