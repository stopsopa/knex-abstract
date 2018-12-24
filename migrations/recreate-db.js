
'use strict';

const knex              = require('@stopsopa/knex-abstract');

const config            = require('../models/config');

const db = config.mysql.connection.database;

delete config.mysql.connection.database;

knex.init(config);

const man = knex().model.common;

const log               = require('@stopsopa/knex-abstract/log/logn');

(async function () {

    try {

        await man.query(`DROP DATABASE IF EXISTS :db:`, {db});
    }
    catch (e) {

        log.dump(e + '');
    }

    try {

        await man.query(`CREATE DATABASE IF NOT EXISTS :db: /*!40100 DEFAULT CHARACTER SET utf8 */`, {db});

        process.stdout.write('recreated');
    }
    catch (e) {

        log.dump(e);
    }

    man.destroy();

}());


