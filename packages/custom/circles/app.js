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

  //We are adding a link to the main menu for all authenticated users
  Circles.menus.add({
    title: 'circles example page',
    link: 'circles example page',
    roles: ['authenticated'],
    menu: 'main'
  });
  
  Circles.aggregateAsset('css', 'circles.css');

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Circles.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Circles.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Circles.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Circles;
});
