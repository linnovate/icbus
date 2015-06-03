'use strict';

var mongoose = require('mongoose'),
  Circle = mongoose.model('Circle');
/* jshint -W098 */
// The Package is past automatically as first parameter
module.exports = function(Circles, app, auth, database) {



  app.route('/api/circles/stubs/permissions/sample/:id?')
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
    .put(function(req, res, next) {

      if (!req.params.id) {
        return res.send(404, 'No ID specified');
      }

      validateCircles(req.params.id, req.body.circles, function(err, status) {

        if (err) {
          return res.send(400, status);
        }

        Circle.findOne({
          _id: req.params.id
        }).exec(function(err, circle) {
          if (!err && circle) {
            Circle.findOneAndUpdate({
              _id: circle._id
            }, {
              $set: req.body
            }, {
              multi: false,
              upsert: false
            }, function(err, circle) {
              if (err) {
                return res.send(500, err.message);
              }

              res.send(200, 'updated');
            });
          }

        });
      });

    })


  .get(function(req, res, next) {
    Circle.buildPermissions(function(data) {
      res.send(data);
    })
  });


  function validateCircles(id, circles, callback) {
    Circle.buildPermissions(function(data) {
      circles = [].concat(circles);
      circles.forEach(function(parent, index) {

        if (data.circles[id].decendants.indexOf(parent) !== -1) {
          return callback(true, 'Cannot reference parent in child relationship')
        }

        if (index === circles.length - 1) {
          return callback(null, 'valid');
        }
      });
    });
  }



};

/*
function buildTree(id, branch) {

     if (noParents(id) && hasChildren(id)) {    
      data[id].children.forEach(function(child) {

        if (id !== child) {

          var length = branch.length;

          branch.push({
            "name": data[child].name,
            "_id": data[child]._id
          });

          if (noChildren(child)) {
            branch[length]["size"] = 1;
          } else {
            
            branch[length]["children"] = []

            buildTree(child, branch[length].children);
          }

        }

      });
    }

  }
*/

/*
 function buildTree(id, branch) {

    if (noParents(id) && hasChildren(id)) {

      var length = branch.length;

      branch.push({
        "name": data[id].name,
        "_id": data[id]._id,
        "children": []
      });

      data[id].children.forEach(function(child) {

        if (id !== child) {
          if (noChildren(child)) {
            branch[length].children.push({
              name: data[child].name,
              _id: data[child]._id,
              size: 1
            });
          } else {            
            buildTree(child, branch[length].children);
          }

        }

      });
    }

  }

*/