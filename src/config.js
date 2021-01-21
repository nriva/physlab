var utilModule = require('./util.js');

function Configuration(attr) {

  this.setDefault = function() {
    this.elastCoeff = 1;
    //this.G = 0.01;
    this.displayFactorSpeed = 50;
    this.displayFactorAccel = 1000;
    this.speedVisible = true;
    this.accelVisible = true;
    this.spdColor = "#000000";
    this.accColor = "#EE0000";
    this.shadow = true;
  };

  if(typeof attr == "undefined")
    this.setDefault();
  else {
    this.elastCoeff = attr.elastCoeff;
    //this.G = attr.G;
    this.displayFactorSpeed = attr.displayFactorSpeed;
    this.displayFactorAccel = attr.displayFactorAccel;
    this.speedVisible = attr.speedVisible;
    this.accelVisible = attr.accelVisible;
    this.spdColor = attr.spdColor;
    this.accColor = attr.accColor;
    this.shadow = attr.shadow;
  }
}

function showConfig(appStatus) {

  if(appStatus.isEditing())
    return;

  if(appStatus.inConfig) {
    return;
  }

  var modal = document.getElementById("modalConfig");
  modal.style.display = "block";

  utilModule.enableElem("startBtn", false);
  utilModule.enableElem("stopBtn", false);

  refreshConfig(appStatus);
  appStatus.inConfig = true;
}

function refreshConfig(appStatus) {
  document.getElementById('defElastCoeff').value = appStatus.configuration.elastCoeff;


  utilModule.setCheckBox('accVis', appStatus.configuration.accelVisible);
  document.getElementById('accMagn').value = appStatus.configuration.displayFactorAccel;
  document.getElementById('accColor').value = appStatus.configuration.accColor;

  utilModule.setCheckBox('spdVis', appStatus.configuration.speedVisible);
  document.getElementById('spdMagn').value = appStatus.configuration.displayFactorSpeed;
  document.getElementById('spdColor').value = appStatus.configuration.spdColor;

  utilModule.setCheckBox('shadowsVis', appStatus.configuration.shadow);

  //document.getElementById('defConstG').value = appStatus.configuration.G;  

  if(appStatus.moduleConfig!=null) {
    appStatus.moduleConfig.forEach(
      (elem) => {
        document.getElementById(elem.elemDefId).value = appStatus.configuration[elem.propDefName];  
      });
  }

}

function closeConfig(appStatus) {
  var n = Number(document.getElementById('defElastCoeff').value);
  if(!isNaN(n)) {
    appStatus.configuration.elastCoeff = n;
  }

  appStatus.configuration.accelVisible = document.getElementById('accVis').checked;
  
  n = Number(document.getElementById('accMagn').value);
  if(!isNaN(n)) {
    appStatus.configuration.displayFactorAccel = n;
  }

  appStatus.configuration.speedVisible = document.getElementById('spdVis').checked;

  n = Number(document.getElementById('spdMagn').value);
  if(!isNaN(n)) {
    appStatus.configuration.displayFactorSpeed = n;
  }

  appStatus.configuration.accColor = document.getElementById('accColor').value;
  appStatus.configuration.spdColor = document.getElementById('spdColor').value;
  appStatus.configuration.shadow = document.getElementById('shadowsVis').checked;

  /*
  n = Number(document.getElementById('defConstG').value);
  if(!isNaN(n)) {
    appStatus.configuration.G = n;
  }
  */

  if(appStatus.moduleConfig!=null) {
    appStatus.moduleConfig.forEach(
      (elem) => {
        var v = document.getElementById(elem.elemDefId).value;
        if(typeof appStatus.configuration[elem.propDefName] === "number")
          v = Number(v);
        appStatus.configuration[elem.propDefName] = v;  
      });
  }  



  localStorage.setItem("config", JSON.stringify(appStatus.configuration));
  hideConfig(appStatus);
}

function resetConfig(appStatus) {
  localStorage.removeItem("config");
  appStatus.configuration.setDefault();
  refreshConfig(appStatus);
  closeConfig(appStatus);
}

function hideConfig(appStatus) {
  var modal = document.getElementById("modalConfig");
  modal.style.display = "none";
  appStatus.inConfig = false;
  if(appStatus.currentSystem && appStatus.currentSystem.bodies.length>0) {
    utilModule.enableElem("startBtn",true);
    utilModule.enableElem("stopBtn", true);
  }
}

function showSysConfig(appStatus) {

  if(appStatus.isEditing())
    return;

  if(appStatus.inConfig)
    return;

  if(appStatus.animationOn)
    return;

  var modal = document.getElementById("modalSysConfig");
  modal.style.display = "block";
  refreshSysConfig(appStatus);
}

function refreshSysConfig(appStatus) {
  document.getElementById('elastCoeff').value = appStatus.currentSystem.config.elastCoeff;
  //document.getElementById('constG').value = appStatus.currentSystem.config.G;

  appStatus.moduleConfig.forEach((elem)=>{
    document.getElementById(elem.elemId).value = appStatus.currentSystem.config[elem.propName];
  });
}

function closeSysConfig(appStatus) {
  var n = Number(document.getElementById('elastCoeff').value);
  if(!isNaN(n)) {
    appStatus.currentSystem.config.elastCoeff = n;
  }

  /*n = Number(document.getElementById('constG').value);
  if(!isNaN(n)) {
    appStatus.currentSystem.config.G = n;
  }*/

  if(appStatus.moduleConfig!=null) {
    appStatus.moduleConfig.forEach(
      (elem) => {
        var v = document.getElementById(elem.elemId).value;
        if(typeof appStatus.configuration[elem.propName] === "number")
          v = Number(v);
        appStatus.currentSystem.config[elem.propName] = v;  
      });
  }
  hideSysConfig(appStatus);
}

function resetSysConfig(appStatus) {
  appStatus.currentSystem.config = appStatus.currentSystem.defaultConfig;
  hideSysConfig(appStatus);
}

function hideSysConfig(appStatus) {
  var modal = document.getElementById("modalSysConfig");
  modal.style.display = "none";
}

module.exports = {
  closeConfig,
  closeSysConfig,
  hideConfig,
  hideSysConfig,
  refreshConfig,
  resetSysConfig,
  resetConfig,
  resetSysConfig,
  showConfig,
  showSysConfig,
  Configuration
}