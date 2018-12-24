'use strict';

const log               = require('@stopsopa/knex-abstract/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../models/config');

knex.init(config);

it('knex - wrong connection name', async done => {

    try {

        knex('test').model.common;
    }
    catch (e) {

        expect(e + '').toEqual("knex.js: Connection 'test' is not defined in config.js under 'knex' key");

        done();
    }
});
