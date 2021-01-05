function collisionManagement(objects, detectCollision, onCollision) {
    for(var i=0;i<objects.length;i++)
        for(var j=0;j<objects.length;j++)
            if(i!=j && i>=j) {
                if( detectCollision(objects[i], objects[j]) ) {
                    if(typeof onCollision === "function")
                        onCollision(objects[i], objects[j]);
                }
            }
}

function interaction(bodies) {
    for(var i1=0;i1<bodies.length;i1++)
        for(var i2=0;i2<bodies.length;i2++)
            if(i1>i2)
            {
                interact(bodies[i1], bodies[i2]);
            }
}
