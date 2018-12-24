'use strict';

const log               = require('../../../../src/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../models/config');

// knex.init(config);  // commented out

it('knex - no init', async done => {

    try {

        await knex().model.common.query('show databases');
    }
    catch (e) {

        expect(e + '').toEqual("Before use require('@stopsopa/knex-abstract')() first use require('@stopsopa/knex-abstract').init(config) and pass config");

        done();
    }

});
