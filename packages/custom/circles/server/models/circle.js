'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CircleSchema = new Schema({
  created: Date,
  updated: Date,
  category: String,
  name: String,
  id: String,
  circles: [{
    type: Schema.ObjectId,
    ref: 'Circle'
  }],
});



CircleSchema.statics.buildPermissions = function(callback) {

  var data = {

  };

  this.find({}).sort({
    circle: 1
  }).exec(function(err, circles) {

    circles.forEach(function(circle) {

      data[circle._id] = circle.toObject();
      data[circle._id].containers = circle.circles;
      data[circle._id].parents = [];
      data[circle._id].decendants = [];
      data[circle._id].children = [];

    });

    var found = true;
    //yes not efficient - getting there..
    var level = 0;
    while (found) {
      found = false;

      circles.forEach(function(circle) {

        var containers = data[circle._id].containers;

        //going through each of the containers parents
        containers.forEach(function(container) {

          if (data[container].decendants.indexOf(circle._id) == -1) {
            data[container].decendants.push(circle._id.toString());
            if (level === 0) {
              data[circle._id].parents.push(container.toString());
              data[container].children.push(circle._id.toString());
            }
          }

          data[container].circles.forEach(function(circ) {
            if (containers.indexOf(circ) == -1 && circ != circle._id) {
              data[circle._id].containers.push(circ.toString());
              found = true;
            }
          });
        });
      });
      level++;
    }

    //now in the sample we are preparing the d3 representation


    var flare = {
      "name": "flare",
      "children": []
    }

    var tree = []

    for (var index in data) {
      buildTree(index, tree);
    }

    callback({
      tree: tree,
      circles: data
    });
  });


  function buildTree(id, branch) {

    if (1 || noParents(id) && hasChildren(id)) {

      var length = branch.length;

      branch.push({
        "name": data[id].name,
        "_id": data[id]._id
      });

      if (hasChildren(id)) {
        branch[length].children = [];
      } else {
        branch[length].size = 1;
      }

      //only goes here if there are children
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

  function noParents(id) {
    return data[id].parents.length === 0
  }

  function noChildren(id) {
    return data[id].children.length === 0
  }

  function hasChildren(id) {
    return !noChildren(id);
  }
};


mongoose.model('Circle', CircleSchema);