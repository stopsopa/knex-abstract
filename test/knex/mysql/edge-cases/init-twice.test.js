'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(5, false, 'tests');

const config            = require('../../../../models/config');

it('knex - init twice', async done => {

    const first     = knex.init(config);

    const second    = knex.init(config);

    expect({
        first,
        second,
    }).toEqual({
        first: 0,
        second: "knex-abstract: Connections are already initialized, no need to call init() again",
    });

    done();
});
