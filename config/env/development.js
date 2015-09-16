'use strict';

module.exports = {
  db: 'mongodb://' + (process.env.DB_PORT_27017_TCP_ADDR || 'localhost') + '/icapi-dev',
  debug: true,
  logging: {
    format: 'tiny'
  },
  letschat:{
    uri: 'http://localhost:5000',
    token: 'NTViZjNkMjJlNjA0NTMwMjc0N2M0ZTc5OmMyNWE4YTQzNzc3ZGFkZDFlMDg3YmJjMDQwODVhM2MzMzhmOWViMDc5NWY0YmIyZg=='
  },
  //  aggregate: 'whatever that is not false, because boolean false value turns aggregation off', //false
  aggregate: false,
  mongoose: {
    debug: false
  },
    hostname: 'http://localhost:3003',
  app: {
    name: 'MEAN - FullStack JS - Development'
  },
  facebook: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/api/auth/facebook/callback'
  },
  twitter: {
    clientID: 'DEFAULT_CONSUMER_KEY',
    clientSecret: 'CONSUMER_SECRET',
    callbackURL: 'http://localhost:3000/api/auth/twitter/callback'
  },
  github: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/api/auth/github/callback'
  },
  google: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/api/auth/google/callback'
  },
  linkedin: {
    clientID: 'DEFAULT_API_KEY',
    clientSecret: 'SECRET_KEY',
    callbackURL: 'http://localhost:3000/api/auth/linkedin/callback'
  },
  emailFrom: 'SENDER EMAIL ADDRESS', // sender address like ABC <abc@example.com>
  mailer: {
    service: 'SMTP', // Gmail, SMTP
    host: 'smtp.gmail.com', //in case of SMTP
    port: 465, // in case of SMTP
    secure: true, // in case of SMTP
    auth: {
      user: 'EMAIL_ID',
      pass: 'PASSWORD'
    }
  }, 
  secret: 'SOME_TOKEN_SECRET',
  elasticsearch: {
    host: 'http://localhost',
    port: 9200,
    log: 'trace'
  },
  icu: {
    uri: 'http://localhost:3000'
  }
};
