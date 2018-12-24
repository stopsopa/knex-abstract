'use strict';

const log               = require('../../../../src/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../example/models/config');

delete config.def;

it('knex - no def', async done => {

    try {

        knex.init(config);
    }
    catch (e) {

        expect(e + '').toEqual("knex.js: Not 'def' connection specified: 'config.js' for knex key 'knex.def'");

        done();
    }

});
