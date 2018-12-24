'use strict';

const log               = require('@stopsopa/knex-abstract/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../models/config');

delete config.mysql.models;

it('knex - no model defined', async done => {

    try {

        knex.init(config);
    }
    catch (e) {

        expect(e + '').toEqual("key 'mysql' defined under server.config -> 'knex' config but there is no models defined for it");

        done();
    }

});
