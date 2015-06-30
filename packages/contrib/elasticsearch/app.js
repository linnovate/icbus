'use strict';

var mean = require('meanio');
var Module = mean.Module;
var elasticsearch = require('elasticsearch');

var Elasticsearch = new Module('elasticsearch');

Elasticsearch.register(function(app, auth, database) {


  Elasticsearch.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Elasticsearch.menus.add({
    title: 'elasticsearch status',
    link: 'elasticsearch status',
    roles: ['admin'],
    menu: 'main'
  });

  Elasticsearch.connect = function() {
      delete Elasticsearch.client;

      Elasticsearch.settings(function(err, config) {

          if (err) {
              return console.log('error retrieving Elasticsearch settings');
          }

          var host = config && config.settings.host ? config.settings.host : 'http://localhost';
          var port = config && config.settings.port ? config.settings.port : '9200';
          var log = config && config.settings.log ? config.settings.log : 'trace';

          Elasticsearch.settings({host:host,port:port,log:log});

          Elasticsearch.client = new elasticsearch.Client({
              host: host + ':' + port,
              log: log
          });
      });
  };

  Elasticsearch.connect();


  Elasticsearch.ping = function(callback) {
    Elasticsearch.client.ping({
      requestTimeout: 100,
      hello: 'elasticsearch!'
    }, function(error) {
      if (error) {
        callback(true, 'cluster down');
      } else {
        callback(null, 'OK');


      }
    });
  };


  Elasticsearch.create = function(options, callback) {
    Elasticsearch.client.create(options, function(error, response) {
      if (error) {
        callback(true, error);
      } else {
        callback(null, response);
      }
    });
  };
    Elasticsearch.index = function(options, callback) {
        Elasticsearch.client.index(options, function(error, response) {
            if (error) {
                callback(true, error);
            } else {
                callback(null, response);
            }
        });
    };

    Elasticsearch.delete = function(options, callback) {
        Elasticsearch.client.delete(options, function(error, response) {
            if (error) {
                callback(true, error);
            } else {
                callback(null, response);
            }
        });
    };

  Elasticsearch.search = function(options, callback) {
    Elasticsearch.client.search(options, function(error, response) {
      if (error) {
        callback(true, error);
      } else {
        callback(null, response);
      }
    });
  };

  return Elasticsearch;
});

mean.elasticsearch = Elasticsearch;
