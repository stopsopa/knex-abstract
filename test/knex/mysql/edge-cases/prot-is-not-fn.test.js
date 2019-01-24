'use strict';

const log               = require('inspc');

const knex              = require('@stopsopa/knex-abstract');

const extend            = knex.extend;

const prototype         = knex.prototype;

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../models/config');

it('knex - prototype is not a function', async done => {

    try {
        extend(knex, {})
    }
    catch (e) {

        expect(e + '').toEqual("extend: prototype is not a function, it is: object");

        done();
    }

});
