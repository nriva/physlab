

function enableElem(id,enable) {

  var elem = null;
  if(typeof id === "string")
  {
    elem = document.getElementById(id)
  }
  else
    elem = id;

  if(elem ==null)
    return;

  if(enable===true) {
    if(elem.hasAttribute("disabled"))
      elem.removeAttribute("disabled");
  }
  else if(enable===false) {
    elem.setAttribute("disabled", "true");
  }
}

function setCheckBox(id, value) {
  document.getElementById(id).checked = value;
}

module.exports = {enableElem, setCheckBox};