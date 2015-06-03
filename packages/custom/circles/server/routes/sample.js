'use strict';

var mongoose = require('mongoose'),
  Circle = mongoose.model('Circle');
/* jshint -W098 */
// The Package is past automatically as first parameter
module.exports = function(Circles, app, auth, database) {



  app.route('/api/circles/stubs/permissions/sample')
    .post(function(req, res, next) {

      var circle = new Circle(req.body);

      console.log(circle);

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

      Circle.find({}).sort({circle:1}).exec(function(err, circles) {

        var data = {containers:{}, circles:{}};

        //find the top level with no circles
        circles.forEach(function(circle) {
          
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

        });


        res.json(data);
      });
    });


};