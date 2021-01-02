function showConfig() {

    if(isEditing())
      return;
  
    if(inConfig) {
      //hideConfig();
      return;
    }
  
    var modal = document.getElementById("modalConfig");
    modal.style.display = "block";
  
    enableElem("startBtn", false);
    enableElem("stopBtn", false);
  
    refreshConfig();
    inConfig = true;
  }
  
  function refreshConfig() {
    document.getElementById('defElastCoeff').value = config.elastCoeff;
    document.getElementById('defConstG').value = config.G;
  
    setCheckBox('accVis', config.accelVisible);
    document.getElementById('accMagn').value = config.displayFactorAccel;
    document.getElementById('accColor').value = config.accColor;
  
    setCheckBox('spdVis', config.speedVisible);
    document.getElementById('spdMagn').value = config.displayFactorSpeed;
    document.getElementById('spdColor').value = config.spdColor;
  
    setCheckBox('shadowsVis', config.shadow);
  }
  
  function closeConfig() {
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
    if(currentSystem && currentSystem.bodies.length>0) {
      enableElem("startBtn",true);
      enableElem("stopBtn", true);
    }
  }




  function showSysConfig() {

    if(isEditing())
      return;
  
    if(inConfig) {
      //hideConfig();
      return;
    }

    if(animationOn)
      return;
  
    var modal = document.getElementById("modalSysConfig");
    modal.style.display = "block";
  
    refreshSysConfig();
  }
  
  function refreshSysConfig() {
    document.getElementById('elastCoeff').value = currentSystem.config.elastCoeff;
    document.getElementById('constG').value = currentSystem.config.G;
  }
  
  function closeSysConfig() {
    var n = Number(document.getElementById('elastCoeff').value);
    if(!isNaN(n)) {
      currentSystem.config.elastCoeff = n;
    }
  
    n = Number(document.getElementById('constG').value);
    if(!isNaN(n)) {
      currentSystem.config.G = n;
    }
  
    hideSysConfig();
  }
  
  function resetSysConfig() {
    currentSystem.config = currentSystem.defaultConfig;

    hideSysConfig();
  }
  
  function hideSysConfig() {
    var modal = document.getElementById("modalSysConfig");
    modal.style.display = "none";
  }
  