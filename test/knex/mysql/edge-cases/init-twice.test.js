'use strict';

const log               = require('../../../../src/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../../example/models/config');

it('knex - init twice', async done => {

    const first     = knex.init(config);

    const second    = knex.init(config);

    expect({
        first,
        second,
    }).toEqual({
        first: 0,
        second: "knex.js: Connections are already initialized, no need to call init() again",
    });

    done();
});
