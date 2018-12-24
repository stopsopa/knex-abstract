'use strict';

const log               = require('../../../../src/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../example/models/config');

knex.init(config);

it('knex - explicit name', async done => {

    const man = knex('mysql').model.common;

    const list = await man.query(`show databases`);

    const db = config.mysql.connection.database;

    const tmp = list.map(t => Object.values(t)[0]).find(x => x === db);

    man.destroy();

    expect(tmp).toEqual(db);

    done();
});
