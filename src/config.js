var utilModule = require('./util.js');

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

var config = defaultConfig;

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
    document.getElementById('defElastCoeff').value = config.elastCoeff;
    document.getElementById('defConstG').value = config.G;
  
    utilModule.setCheckBox('accVis', config.accelVisible);
    document.getElementById('accMagn').value = config.displayFactorAccel;
    document.getElementById('accColor').value = config.accColor;
  
    utilModule.setCheckBox('spdVis', config.speedVisible);
    document.getElementById('spdMagn').value = config.displayFactorSpeed;
    document.getElementById('spdColor').value = config.spdColor;
  
    utilModule.setCheckBox('shadowsVis', config.shadow);
  }
  
  function closeConfig(appStatus) {
    var n = Number(document.getElementById('defElastCoeff').value);
    if(!isNaN(n)) {
      config.elastCoeff = n;
    }
  
    n = Number(document.getElementById('defConstG').value);
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
  
    config.accColor = document.getElementById('accColor').value;
    config.spdColor = document.getElementById('spdColor').value;
  
    config.shadow = document.getElementById('shadowsVis').checked;
  
    localStorage.setItem("config", JSON.stringify(config));
    hideConfig(appStatus);
  }
  
  function resetConfig(appStatus) {
    localStorage.removeItem("config");
    config = defaultConfig;
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
  
    if(appStatus.inConfig) {
      return;
    }

    if(appStatus.animationOn)
      return;
  
    var modal = document.getElementById("modalSysConfig");
    modal.style.display = "block";
  
    refreshSysConfig(appStatus);
  }
  
  function refreshSysConfig(appStatus) {
    document.getElementById('elastCoeff').value = appStatus.currentSystem.config.elastCoeff;
    document.getElementById('constG').value = appStatus.currentSystem.config.G;
  }
  
  function closeSysConfig(appStatus) {
    var n = Number(document.getElementById('elastCoeff').value);
    if(!isNaN(n)) {
      appStatus.currentSystem.config.elastCoeff = n;
    }
  
    n = Number(document.getElementById('constG').value);
    if(!isNaN(n)) {
      appStatus.currentSystem.config.G = n;
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
    config
  }