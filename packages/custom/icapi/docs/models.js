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
  }
};