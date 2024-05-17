
/**
 * Simple euclidean collision detection
 * @param {*} o1 First object
 * @param {*} o2 Second object
 * @returns whether o1 and o2 collide or not
 */
function detectCollision(o1, o2) {
    var x = o1.x-o2.x;
    var y = o1.y-o2.y;
  
    return x*x+y*y < (o1.getRadius()+o2.getRadius())*(o1.getRadius()+o2.getRadius());
  }

function collisionManagement(objects, onCollision) {
    for(var i=0;i<objects.length;i++)
        for(var j=0;j<objects.length;j++)
            if(i!=j && i>=j)
                if( detectCollision(objects[i], objects[j]) )
                    onCollision(objects[i], objects[j]);
}

function interaction(bodies,config,sysConfig,interact) {
    for(var i1=0;i1<bodies.length;i1++)
        for(var i2=0;i2<bodies.length;i2++)
            if(i1>i2)
                interact(bodies[i1], bodies[i2], config, sysConfig);
}

module.exports = {collisionManagement, interaction};
