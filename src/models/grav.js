const configModule = require('../config.js');

const interactionTitle = "Attractive Force Interaction";
const interactionName = "attraction";
const interactionVersion = "1";

const interactionExtraConfigurationLabel = "Attraction Extra Configuration";

function interactFunction(o1, o2, config) {

    var x = o1.x-o2.x;
    var y = o1.y-o2.y;

    // Angolo del vettore f
    var alpha = Math.atan(Math.abs(y/x));

    var f = config.systemProperties.G / Math.sqrt(x*x + y*y);

    // componenti di f lungo gli assi
    var fx1 = f * Math.cos(alpha) * o2.getMass();
    var fy1 = f * Math.sin(alpha) * o2.getMass();

    var fx2 = f * Math.cos(alpha) * o1.getMass();
    var fy2 = f * Math.sin(alpha) * o1.getMass();

    if(x>0) fx1 = - fx1; o1.ax += fx1;
    if(y>0) fy1 = - fy1; o1.ay += fy1;

    if(x<0) fx2= - fx2; o2.ax += fx2;
    if(y<0) fy2= - fy2; o2.ay += fy2;
};



// const extraConfigurationRows = [
//     '<td><label>Attraction Configuration:</label></td>',
//     '<td><label>Default G constant:</label></td><td><input type=text id=defConstG maxlength="4" style="width: 2em"></td>'
// ];

// const extraSystemConfRows = [
//     '<td><label>G const:</label></td><td><input type=text id=constG maxlength="4" style="width: 2em"></td>'
// ];


function buildDemoSystems(centerX, centerY) {
    return {
    "System1": {
    config: {G: 0.01},
    bodiesAttr: [
        {"id":"B0000","x":centerX,"y":centerY,"ax":0,"ay":0,"dx":0,"dy":0,"density":1,"index":0,"radius":20,"motionless":false,"color":"yellow"}
        ,{"id":"B0001","x":centerX,"y":centerY/4,"ax":0,"ay":0,"dx":2,"dy":0,"density":1,"index":1,"radius":10,"motionless":false,"color":"lightblue"}
    ],
    bodies : [],
    gbodies : []
    },
    "System2" : {
        config: {G: 0.01},
        bodiesAttr: [
        {"id":"B0000","x":centerX,"y":centerY,"ax":0,"ay":0,"dx":0,"dy":0,"density":1,"index":0,"radius":20,"motionless":false,"color":"pink"}
        ,{"id":"B0001","x":centerX,"y":centerY/4,"ax":0,"ay":0,"dx":2,"dy":0,"density":1,"index":1,"radius":10,"motionless":false,"color":"blue"}],
        bodies : [],
        gbodies : []
    }
    };
}

var moduleConfigDefinition = [
    new configModule.SystemProperty(
    { 
    propName: 'G'
    , defValue: 0.01
    , labelForDefaultValue: "Default G Constant"
    , labelForSystemValue: "G Constant"
    , maxlength: 4
    })
];

module.exports = {
    interactionName
    , interactionVersion
    , interactionTitle
    , interactionExtraConfigurationLabel
    , moduleConfigDefinition
    , interactFunction
    , buildDemoSystems
};