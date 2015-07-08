'use strict';

exports.load = function(swagger, parms) {

  var searchParms = parms.searchableOptions;

  var usersList = {
    'spec': {
      description: 'Users operations',
      path: '/users',
      method: 'GET',
      summary: 'Get all Users',
      notes: '',
      type: 'User',
      nickname: 'getUsers',
      produces: ['application/json'],
      params: searchParms
    }
  };

  var showProfile = {
    'spec': {
      description: 'Users operations',
      path: '/propile',
      method: 'GET',
      summary: 'Get user\'s profile',
      notes: '',
      type: '{}',
      nickname: 'getProfile',
      produces: ['application/json'],
      params: searchParms
    }
  };

  var updateProfile = {
    'spec': {
      description: 'Users operations',
      path: '/propile',
      method: 'PUT',
      summary: 'Update user\'s profile',
      notes: '',
      type: '{}',
      nickname: 'updateProfile',
      produces: ['application/json'],
      params: searchParms,
      parameters: [{
        name: 'body',
        description: 'User\'s profile to update.  User will be inferred by the authenticated user.',
        required: true,
        type: '{}',
        paramType: 'body',
        allowMultiple: false
      }]
    }
  };

  var tasksList = {
    'spec': {
      description: 'Task list',
      path: '/tasks',
      method: 'GET',
      summary: 'Get tasks list',
      notes: '',
      type: 'Task',
      nickname: 'GetTasks',
      produces: ['application/json'],
      params: searchParms
    }
  };

  var createTask = {
    'spec': {
      description: 'Task creation',
      path: '/tasks',
      method: 'POST',
      summary: 'create a task',
      notes: '',
      type: 'Task',
      nickname: 'createTask',
      produces: ['application/json'],
      parameters: [{
        name: 'body',
        description: 'task to create',
        required: true,
        type: 'Task',
        paramType: 'body',
        allowMultiple: false
      }]
    }
  };


  swagger.addGet(usersList)
    .addGet(showProfile)
    .addPut(updateProfile)
      .addGet(tasksList)
      .addPost(createTask)


};