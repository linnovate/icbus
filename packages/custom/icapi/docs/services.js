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
      description: 'Tasks operations',
      path: '/task',
      method: 'GET',
      summary: 'Get tasks list',
      notes: 'The really path is \'/tasks\' ',
      type: '',
      nickname: 'GetTasks',
      produces: ['application/json'],
      params: searchParms
    }
  };
  var tasksList = {
    'spec': {
      description: 'Tasks operations',
      path: '/task',
      method: 'GET',
      summary: 'Get tasks list',
      notes: 'The really path is \'/tasks\'. \n you can add query as: /tasks?status=completed&tags=1,2,3',
      type: '',
      nickname: 'GetTasks',
      produces: ['application/json'],
      params: ['status']
    }
  };

  var tagsList = {
    'spec': {
      description: 'List of all tags',
      path: '/task/tags',
      method: 'GET',
      summary: 'Get tags list',
      notes: 'The really path is \'/tasks/tags\' ',
      type: 'string',
      nickname: 'GetTags',
      produces: ['application/json'],
      params: searchParms
    }

  };

  var createTask = {
    'spec': {
      description: 'Task creation',
      path: '/task',
      method: 'POST',
      summary: 'create a task',
      notes: '------------------------there is a problem to create via swagger, because you don\'t have req.user------------------',
      type: 'Task',
      nickname: 'createTask',
      produces: ['application/json'],
      parameters: [{
        name: 'body',
        description: 'task to create (into \'data\' main key)',
        required: true,
        type: 'Task',
        paramType: 'body',
        allowMultiple: false
      }]
    }
  };

  var getTask ={
    'spec': {
      description: 'get a single task',
      path: '/task/:id',
      method: 'GET',
      summary: 'get a single task',
      notes: 'The really path is \'/tasks/:id\' ',
      type: 'Task',
      nickname: 'GetTask',
      produces: ['application/json'],
      params: searchParms
    }
  };

  var updateTask = {
    'spec': {
      description: 'Update a task',
      path: '/task/:id',
      method: 'PUT',
      summary: 'Update a task',
      notes: 'The really path is \'/tasks/:id\'',
      type: 'Task',
      nickname: 'updateTask',
      produces: ['application/json'],
      params: searchParms,
      parameters: [{
        name: 'body',
        description: 'task to update (into \'data\' main key)',
        required: true,
        type: 'Task',
        paramType: 'body',
        allowMultiple: false
      }]
    }
  };

  var deleteTask = {
    'spec': {
      description: 'Delete a task',
      path: '/task/:id',
      method: 'DELETE',
      summary: 'delete a task',
      notes: 'The really path is \'/tasks/:id\'',
      type: 'Task',
      nickname: 'deleteTask',
      produces: ['application/json'],
    }
  };

  var getTasksPerEntity = {
    'spec': {
      description: 'get a list of tasks per user/project',
      path: '/:entity/:id/tasks',
      method: 'GET',
      summary: 'get a list of tasks per user/project/...',
      notes: '',
      type: 'Task',
      nickname: 'GetTask',
      produces: ['application/json'],
      params: searchParms
    }
  };

  var tasksHistory = {
    'spec': {
      description: 'get all updates history for a single task',
      path: '/history/tasks/:id',
      method: 'GET',
      summary: 'get all updates history for a single task',
      notes: '',
      type: 'Archive',
      nickname: 'GetTaskHistory',
      produces: ['application/json'],
      params: searchParms
    }
  };

  var createProject = {
    'spec': {
      description: 'Project creation',
      path: '/projects',
      method: 'POST',
      summary: 'create a project',
      notes: '------------------------there is a problem to create via swagger, because you don\'t have req.user------------------',
      type: 'Project',
      nickname: 'createProject',
      produces: ['application/json'],
      parameters: [{
        name: 'body',
        description: 'Project to create',
        required: true,
        type: 'Project',
        paramType: 'body',
        allowMultiple: false
      }]
    }
  };

  var projectsList = {
    'spec': {
      description: 'project operations',
      path: '/projects',
      method: 'GET',
      summary: 'Get tasks list',
      notes: '',
      type: 'Project',
      nickname: 'GetTasks',
      produces: ['application/json'],
      params: searchParms
    }
  };





  swagger
      .addGet(usersList)
      .addGet(showProfile)
      .addGet(tasksList)
      .addPost(createTask)
      .addPut(updateProfile)
      .addGet(projectsList)
      .addPost(createProject)
      .addGet(tagsList)
      .addGet(getTask)
      .addPut(updateTask)
      .addDelete(deleteTask)
      .addGet(getTasksPerEntity)
      .addGet(tasksHistory)
};