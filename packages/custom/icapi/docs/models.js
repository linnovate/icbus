exports.models = {

  User: {
    id: 'User',
    required: ['name', 'email', 'username'],
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the User'
      },
      name: {
        type: 'string',
        description: 'Name of the user'
      },
      email: {
        type: 'string',
        description: 'Email of the user'
      },
      username: {
        type: 'string',
        description: 'Unique username'
      },
      roles: {
        type: 'array',
        description: 'List of user\'s roles'
      },
      profile: {
        type: 'object',
        description: 'The user\'s personal profiles'
      }
    }
  },

  Task : {
    id :'Task',
    required :['title', 'project'],
    properties : {
      id : {
        type: 'string',
        description: 'Unique identifier for the task'
      },
      title: {
        type: 'string',
        description: ''
      },
      project : {
        type: 'string',
        description: 'id of project'
      },
      parent : {
        type: 'string',
        description: 'id of another task'
      },
      creator: {
        type: 'string',
        description: 'id of user who created the task'
      },
      manager: {
        type: 'string',
        description: 'id of user who manages the task'
      },
      tags: {
        type: 'array',
        description: 'array of tags '
      },
      status: {
        type: 'string',
        description: 'enum: [\'Received\', \'Completed\']'
      },
      due: {
        type: 'date',
        description: 'due date of task'
      },
      watchers : {
        type: 'array',
        description: 'array of users ids of watchers users'
      }

    }

  }
};