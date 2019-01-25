'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('@stopsopa/dotenv-up')(5, false, 'tests');

const config            = require('../../../../models/config');

knex.init(config);

it('knex - wrong connection name', async done => {

    try {

        knex('test').model.common;
    }
    catch (e) {

        expect(e + '').toEqual("knex-abstract: Connection 'test' is not defined in config.js under 'knex' key");

        done();
    }
});
