'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(5, false, 'tests');

const config            = require('../../../../models/config');

delete config.def;

it('knex - no def', async done => {

    try {

        knex.init(config);
    }
    catch (e) {

        expect(e + '').toEqual("knex-abstract: Not 'def' connection specified: 'config.js' for knex key 'knex.def'");

        done();
    }

});
