function collisionManagement(objects,onCollision)
{
    for(var i=0;i<objects.length;i++)
        for(var j=0;j<objects.length;j++)
        if(i!=j && i>=j)
        {
            var o1 = objects[i];
            var o2 = objects[j];

            var x = o1.x-o2.x;
            var y = o1.y-o2.y;

            if(x*x+y*y< (o1.getRadius()+o2.getRadius())*(o1.getRadius()+o2.getRadius()) )
            {
            // Collisione
            //animationOn = false;

            if(typeof onCollision === "function")
                onCollision();

            //var p1 = o1.getMomentum();
            //var p2 = o2.getMomentum();

            }
        }
}

function interaction(bodies)
{
    for(var i1=0;i1<bodies.length;i1++)
        for(var i2=0;i2<bodies.length;i2++)
        if(i1>i2)
        {
            interact(bodies[i1], bodies[i2]);
        }

}
