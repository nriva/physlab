const utilModule = require('./util.js');
const $ = require( "jquery" );

const PROPERTY_ID_PREFIX = {
  currentValueIdPrefix : "propCurrentVaule_",
  systemValueIdPrefix : "propSystemVaue_"
}

/** Physical property of a system */
function SystemProperty(attr) {
  this.propName = attr.propName;
  this.defValue = attr.defValue;
  this.labelForDefaultValue = attr.labelForDefaultValue;
  this.labelForSystemValue = attr.labelForSystemValue;
  this.maxlength = attr.maxlength;
  this.propType = "number";
}

var systemPropertyDefinitions = [
  new SystemProperty(
  { 
  propName: 'elastCoeff'
  , defValue: 1
  , labelForDefaultValue: "Default Walls Elastic Coeff"
  , labelForSystemValue: "Walls Elastic Coeff"
  , maxlength: 4
  })
];

function Configuration(attr, moduleConfig) {

  this.systemProperties = {};

  this.setDefault = function(moduleConfig) {
    this.displayFactorSpeed = 50;
    this.displayFactorAccel = 1000;
    this.speedVisible = true;
    this.accelVisible = true;
    this.spdColor = "#000000";
    this.accColor = "#EE0000";
    this.shadow = true;

    for(var i=0;i<systemPropertyDefinitions.length;i++) {
      this.systemProperties[systemPropertyDefinitions[i].propName] = systemPropertyDefinitions[i].defValue;
    }    
    if(moduleConfig) {
      for(var i=0;i<moduleConfig.length;i++) {
        this.systemProperties[moduleConfig[i].propName] = moduleConfig[i].defValue;
      }
    }
  };


  if(typeof attr == "undefined" || attr == null) {
    this.setDefault(moduleConfig);
  } else {
    
    this.displayFactorSpeed = attr.displayFactorSpeed;
    this.displayFactorAccel = attr.displayFactorAccel;
    this.speedVisible = attr.speedVisible;
    this.accelVisible = attr.accelVisible;
    this.spdColor = attr.spdColor;
    this.accColor = attr.accColor;
    this.shadow = attr.shadow;


    const attrSysProps = attr.systemProperties;
    for(var i=0;i<systemPropertyDefinitions.length;i++) {
      this.systemProperties[systemPropertyDefinitions[i].propName] =  attrSysProps[systemPropertyDefinitions[i].propName];
    }       

    if(moduleConfig) {
      for(var i=0;i<moduleConfig.length;i++) {
        this.systemProperties[moduleConfig[i].propName] = attrSysProps[moduleConfig[i].propName];
      }
    }
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
  //$('#defElastCoeff').val(appStatus.configuration.elastCoeff);

  const currentConfiguration = appStatus.currentConfiguration;

  utilModule.setCheckBox('accVis', currentConfiguration.accelVisible);
  $('#accMagn').val(currentConfiguration.displayFactorAccel);
  $('#accColor').val(currentConfiguration.accColor);

  utilModule.setCheckBox('spdVis', currentConfiguration.speedVisible);
  $('#spdMagn').val(currentConfiguration.displayFactorSpeed);
  $('#spdColor').val(currentConfiguration.spdColor);

  utilModule.setCheckBox('shadowsVis', currentConfiguration.shadow);

  systemPropertyDefinitions.forEach((profDefinition)=>{
    $('#' + PROPERTY_ID_PREFIX.currentValueIdPrefix + profDefinition.propName).val(currentConfiguration.systemProperties[profDefinition.propName])
  });

  appStatus.modulePropertyDefinitions.forEach((profDefinition)=>{
    $('#' + PROPERTY_ID_PREFIX.currentValueIdPrefix + profDefinition.propName).val(currentConfiguration.systemProperties[profDefinition.propName])
  });  



}

function closeConfig(appStatus) {


  appStatus.currentConfiguration.accelVisible = document.getElementById('accVis').checked;
  
  n = Number($('#accMagn').val());
  if(!isNaN(n)) {
    appStatus.currentConfiguration.displayFactorAccel = n;
  }

  appStatus.currentConfiguration.speedVisible = document.getElementById('spdVis').checked;

  n = Number($('#spdMagn').val());
  if(!isNaN(n)) {
    appStatus.currentConfiguration.displayFactorSpeed = n;
  }

  appStatus.currentConfiguration.accColor = $('#accColor').val();
  appStatus.currentConfiguration.spdColor = $('#spdColor').val();
  appStatus.currentConfiguration.shadow = document.getElementById('shadowsVis').checked;

  if(appStatus.modulePropertyDefinitions!=null) {
    appStatus.modulePropertyDefinitions.forEach(
      (propDefinition) => {
        var v = $('#' + PROPERTY_ID_PREFIX.currentValueIdPrefix + propDefinition.propName).val();
        if(typeof appStatus.currentConfiguration.systemProperties[propDefinition.propName] === "number")
          v = Number(v);
        appStatus.currentConfiguration.systemProperties[propDefinition.propName] = v;  
      });
  }

  localStorage.setItem(appStatus.interactionName + "/config", JSON.stringify(appStatus.currentConfiguration));
  hideConfig(appStatus);
}

function resetConfig(appStatus) {
  localStorage.removeItem(appStatus.interactionName + "/config");
  appStatus.currentConfiguration.setDefault(appStatus.modulePropertyDefinitions);
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

  // var modal = document.getElementById("modalSysConfig");
  // modal.style.display = "block";
  $('#modalSysConfig').show();
  refreshSysConfig(appStatus);
}

function refreshSysConfig(appStatus) {

  systemPropertyDefinitions.forEach((elem)=>{
    $('#' + PROPERTY_ID_PREFIX.systemValueIdPrefix + elem.propName).val(appStatus.currentSystem.config.systemProperties[elem.propName]);
  });

  appStatus.modulePropertyDefinitions.forEach((elem)=>{
    $('#' + PROPERTY_ID_PREFIX.systemValueIdPrefix + elem.propName).val(appStatus.currentSystem.config.systemProperties[elem.propName]);
  });
}

function closeSysConfig(appStatus) {


  systemPropertyDefinitions.forEach(
    (elem) => {
      var v = $('#' + PROPERTY_ID_PREFIX.systemValueIdPrefix + elem.propName).val();
      if(elem.propType  === "number")
        v = Number(v);
      appStatus.currentSystem.config.systemProperties[elem.propName] = v;  
    });


  if(appStatus.modulePropertyDefinitions) {
    appStatus.modulePropertyDefinitions.forEach(
      (elem) => {
        var v = $('#' + PROPERTY_ID_PREFIX.systemValueIdPrefix + elem.propName).val();
        if(elem.propType === "number")
          v = Number(v);
        appStatus.currentSystem.config.systemProperties[elem.propName] = v;  
      });
  }
  hideSysConfig(appStatus);
}

function resetSysConfig(appStatus) {
  // TODO:
  //appStatus.currentSystem.config = appStatus.currentSystem.defaultConfig;
  hideSysConfig(appStatus);
}

function hideSysConfig(appStatus) {
  $("#modalSysConfig").hide();
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
  systemPropertyDefinitions,
  Configuration,
  SystemProperty
}