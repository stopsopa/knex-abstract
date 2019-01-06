
'use strict';

const knex              = require('@stopsopa/knex-abstract');

const config            = require('../models/config');

const db = config.mysql.connection.database;

delete config.mysql.connection.database;

knex.init(config);

const man = knex().model.common;

const log               = require('@stopsopa/knex-abstract/log/logn');

const mode = process.argv[2];

if ( ! ( mode === 'safe' || mode === 'dangerous' ) ) {

    console.log(`run: node ${__filename} safe|dangerous`);

    process.exit(1);
}

const dangerous = (mode === 'dangerous');

(async function () {

    if (dangerous) {

        try {

            await man.query(`DROP DATABASE IF EXISTS :db:`, {db});
        }
        catch (e) {

            log.dump(e + '');
        }
    }

    try {

        await man.query(`CREATE DATABASE IF NOT EXISTS :db: /*!40100 DEFAULT CHARACTER SET utf8 */`, {db});

        console.log(dangerous ? 'recreated (DANGEROUS)' : 'just created (SAFE)');
    }
    catch (e) {

        log.dump(e);
    }

    man.destroy();

}());


