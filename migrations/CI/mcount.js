/**
 * Script to determine how many migrations were executed until now
 */
const path = require('path');

const {createConnection} = require('typeorm');

const config = require(path.resolve(__dirname, '..', 'ormconfig.js'));

const log = require('./log/logn');

(async () => {
  let connection;

  try {
    connection = await createConnection(config);

    let list;

    switch (config.type) {
      case 'postgres':
        list = await connection.manager.query(`SELECT *
FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND 
    schemaname != 'information_schema'`);

        list = list.map((r) => ({tablename: r.tablename}));
        break;
      case 'mysql':
        list = await connection.manager.query(`show tables`);
        break;
      default:
        throw new Error(`mcount.js error: unknown type (${config.type})`);
    }

    const migrationsTableName = connection.options.migrationsTableName || 'migrations';

    list = list.map((RowDataPacket) => Object.values(RowDataPacket)[0]);

    const found = !!(list.find((t) => t === migrationsTableName) || []).length;

    let count = '0';

    if (found) {
      count = await connection.manager.query(`select count(*) c from ${migrationsTableName}`);

      count = Object.values(count[0])[0];
    }

    process.stdout.write(count);

    switch (config.type) {
      case 'postgres':
        break;
      case 'mysql':
        await connection.close();
      default:
        throw new Error(`mcount.js error: unknown type 2 (${config.type})`);
    }
  } catch (e) {
    console.log('CATCH ERROR: ', e);

    switch (config.type) {
      case 'postgres':
        break;
      case 'mysql':
        await connection.close();
      default:
        throw new Error(`mcount.js error: unknown type 3 (${config.type})`);
    }

    setTimeout(() => process.exit(1), 1);

    throw e;
  }
})();
