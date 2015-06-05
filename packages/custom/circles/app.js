'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Circles = new Module('circles');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Circles.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Circles.routes(app, auth, database);
 
  Circles.aggregateAsset('css', 'circles.css');


  Circles.aggregateAsset('js','d3.v3.min.js');

  Circles.menus.add({
    title: 'Circles',
    link: 'manage circles',
    roles: ['authenticated'],
    menu: 'main'
  });
  

  return Circles;
});
