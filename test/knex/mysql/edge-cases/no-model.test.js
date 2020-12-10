'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(5, false, 'tests');

const config            = require('../../../../models/config');

delete config.mysql.models;

it('knex - no model defined', async done => {

    try {

        knex.init(config);
    }
    catch (e) {

        expect(String(e)).toEqual("Error: key 'mysql' defined under server.config -> 'knex' config but there is no models defined for it");

        done();
    }

});
