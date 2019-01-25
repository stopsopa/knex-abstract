'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(5, false, 'tests');

const config            = require('../../../../models/config');

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
