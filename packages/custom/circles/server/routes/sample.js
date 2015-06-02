'use strict';

var mongoose = require('mongoose'),
  Circle = mongoose.model('Circle');
/* jshint -W098 */
// The Package is past automatically as first parameter
module.exports = function(Circles, app, auth, database) {



  app.route('/api/circles/stubs/permissions/sample')
    .post(function(req, res, next) {

      var circle = new Circle(req.body);

      circle.save(function(err) {
        if (err) {
          return res.status(500).json({
            error: 'Cannot save the circle'
          });
        }
        res.json(circle);
      });
    })
    .get(function(req, res, next) {

      Circle.find({}).sort({
        circle: 1
      }).exec(function(err, circles) {


        var data = {
                    
        };
        
        circles.forEach(function(circle) {

          data[circle._id] = circle.toObject();
          data[circle._id].containers = circle.circles;
          

        });        


        
          //want an array of all things that contain the circle
          //loop through all the circles
          //each circle knows who its parent is. therefore we can just take each one out of the next in a chain

          //loop from circles and add all circles to containers
          //count number of moves.
          //when no moves we are done
          //container cannever contain itself

          var found = true;


          while(found) {
            found = false;
            console.log('loop');

            circles.forEach(function(circle) {


              var containers = data[circle._id].containers;

console.log(1)
              //going through each of the containers parents
              containers.forEach(function(container) {
                console.log(2)
                console.log(JSON.stringify(data[container]));

                data[container].circles.forEach(function(circ) {
                  console.log(3)
                  if (containers.indexOf(circ) == -1 && circ != circle._id) {
                    data[circle._id].containers.push(circ);
                    found = true;
                  }
                });
              });
            });
          }
        

        res.json(data);
      });
    });


};


function popup(circles, base, found) {

    base.forEach(function(base) {

      if (found.indexOf(base) == -1) {
        tree(base).push(circles);
        found.push(base);
        if (circles[base._id]) {
          popup(circles, circles[base._id].circles, found);
        } 

      }
    });
  }
  /*
            
            if (!data.containers[circle._id]) {
              data.containers[circle._id] = [];
            } 

            if (!circle.circle) {
              data.circles[circle._id] = circle.toObject();
            } else {

   //we need to also check containers incase its ot in flat circles.
              //order matters
              console.log(data.circles[circle.circle]);
              console.log(circle._id);
              data.circles[circle.circle][circle._id] = circle;

              data.containers[circle._id].push(circle.circle);
              //need to work on the container here
            }
  */