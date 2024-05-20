const configModule = require('../config.js');

const interactionTitle = "PID Control simulation";
const interactionName = "pidctrl";
const interactionVersion = "1";

const interactionExtraConfigurationLabel = "Chaser Extra Configuration";

var prevErr= NaN;
var sumErr= 0;

const MAX_I = 10;
var TAU=100;
var tau = Number.NEGATIVE_INFINITY;

function interactFunction(o1,o2,config) {

    var hunter = null;
    var prey = null;
    if(o1.name==="hunter")
    {
        hunter = o1;
        prey = o2;
    } else {
        hunter = o2;
        prey = o1;

    }

    if(Number.isFinite(tau)) {
        tau++;
        if(tau==TAU)
            tau=0;
    } else {
        tau=0;
    }
    if(tau>0) {
        return;
    }

    var x = hunter.x-prey.x;
    var y = hunter.y-prey.y;

    // Angolo del vettore
    var alpha = Math.atan(Math.abs(y/x));

    // Funzione errore: distanza euclidea
    var e = Math.sqrt(x*x+y*y);

    var a = 0; 
    
    // Costanti PID
    var Kp = config.systemProperties.Kp; // 0.01; // 0.1;
    var Kd = config.systemProperties.Kd; // 0.01;
    var Ki = config.systemProperties.Ki; // 0.0001;
    // Proportional
    a = Kp * e;

    // Derivative
    if(!isNaN(prevErr)) a += Kd * Math.abs(prevErr-e) / TAU;

    // Integral
    a +=  Ki * sumErr * TAU;


    // componenti di f lungo gli assi
    var ax1 = a * Math.cos(alpha);
    var ay1 = a * Math.sin(alpha); 

    if(x>0) ax1 = - ax1; 
    if(y>0) ay1 = - ay1; 
    hunter.ax = ax1;
    hunter.ay = ay1;


    if(Math.random()<0.5) {
        if(Math.random()<0.50)
            prey.dx = - prey.dx;
        else
            prey.dy = - prey.dy;
    }

    prevErr = e;

    sumErr += e;
};



var moduleConfigDefinition = [
    new configModule.SystemProperty(
    { 
    propName: 'Kp'
    , defValue: 0.01
    , labelForDefaultValue: "Default Linear error factor"
    , labelForSystemValue: "Linear error factor"
    , maxlength: 8
    }),
    new configModule.SystemProperty(
    { 
    propName: 'Kd'
    , defValue: 0.01
    , labelForDefaultValue: "Default Derivative error factor"
    , labelForSystemValue: "Derivative error factor"
    , maxlength: 8
    }),
    new configModule.SystemProperty(
    { 
    propName: 'Ki'
    , defValue: 0.0001
    , labelForDefaultValue: "Default Integral error factor"
    , labelForSystemValue: "Integral error factor"
    , maxlength: 8
    })        

];

function buildDemoSystems(centerX, centerY) {

    return {
    "name1": {
    config: {systemProperties: {Kp: 0.01, Kd: 0.01, Ki: 0.0001, elastCoeff:0.95}},
    bodiesAttr: [
      {"id":"B0000","name":"hunter","x":20,"y":20,"ax":0,"ay":0,"dx":0,"dy":0,"density":1,"index":0,"radius":10,"motionless":false,"color":"red"}
      ,{"id":"B0001","name":"prey", "x":centerX,"y":centerY/2,"ax":0,"ay":0.01,"dx":2,"dy":0,"density":1,"index":1,"radius":10,"motionless":false,"color":"lightblue"}
    ]
    }
    };
}

 

module.exports = {interactFunction
    , interactionName
    , interactionTitle
    , interactionVersion
    , moduleConfigDefinition
    , interactionExtraConfigurationLabel
    , buildDemoSystems};