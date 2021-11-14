const path = require('path');

const fs = require('fs');

const env = path.resolve(__dirname, '..', '.env');

if (!fs.existsSync(env)) {

  throw new Error(`Env file '${env}' doesn't exist`);
}

require('dotenv').config({path: env})

if (typeof process.env.MYSQL_HOST === 'undefined') {

  throw new Error(`MYSQL_HOST in undefined`);
}

if (typeof process.env.MYSQL_PORT === 'undefined') {

  throw new Error(`MYSQL_PORT in undefined`);
}

if (typeof process.env.MYSQL_USER === 'undefined') {

  throw new Error(`MYSQL_USER in undefined`);
}

if (typeof process.env.MYSQL_PASS === 'undefined') {

  throw new Error(`MYSQL_PASS in undefined`);
}

if (typeof process.env.MYSQL_DB === 'undefined') {

  throw new Error(`MYSQL_DB in undefined`);
}

const config = {
  "type": "mysql",
  "host": process.env.MYSQL_HOST,
  "port": process.env.MYSQL_PORT,
  "username": process.env.MYSQL_USER,
  "password": process.env.MYSQL_PASS,
  "database": process.env.MYSQL_DB,
  "synchronize": false,
  "logging": false,
  "exclude": [
    "node_modules"
  ],
  "entities": [
    "src/entity/**/*.ts"
  ],
  "migrations": [
    "src/migration/**/*.ts"
  ],
  "subscribers": [
    "src/subscriber/**/*.ts"
  ],
  "cli": {
    "entitiesDir": "src/entity",
    "migrationsDir": "src/migration",
    "subscribersDir": "src/subscriber"
  },
  "tmpts": "src/tmpts"
}

module.exports = config;
