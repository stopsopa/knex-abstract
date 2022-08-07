const path = require('path');

const env = path.resolve(__dirname, '..', '.env');

const fsPromises = require('node:fs/promises');

const th = (msg) => th(`mysql-test.js error: ${msg}`);

const log = console.log;

async function notExist(file) {
  try {
    await fsPromises.stat(file);
    return false;
  } catch (e) {
    return e;
  }
}

(async () => {
  try {
    {
      const nExist = await notExist(env);

      if (nExist) {
        throw th(`file '${env}' doesn't exist (${nExist.message})`);
      }
    }

    require('dotenv').config({path: env});

    if (typeof process.env.MYSQL_HOST !== 'string') {
      throw th(`MYSQL_HOST in undefined`);
    }

    if (typeof process.env.MYSQL_PORT !== 'string') {
      throw th(`MYSQL_PORT in undefined`);
    }

    if (typeof process.env.MYSQL_USER !== 'string') {
      throw th(`MYSQL_USER in undefined`);
    }

    if (typeof process.env.MYSQL_PASS !== 'string') {
      throw th(`MYSQL_PASS in undefined`);
    }

    if (typeof process.env.MYSQL_DB !== 'string') {
      throw th(`MYSQL_DB in undefined`);
    }

    const knex = require('knex')({
      client: 'mysql',
      connection: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DB,
      },
    });

    const row = await knex.raw('show databases');

    const databases = row[0];

    log(databases);

    knex.destroy();
  } catch (e) {
    log(`
    
Global catch:     
    
    `);

    throw e;
  }
})();
