'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Applications = new Module('applications');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Applications.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Applications.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Applications.menus.add({
    title: 'applications example page',
    link: 'applications example page',
    roles: ['authenticated'],
    menu: 'main'
  });
  
  Applications.aggregateAsset('css', 'applications.css');

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Applications.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Applications.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Applications.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Applications;
});
