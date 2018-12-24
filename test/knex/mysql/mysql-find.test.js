'use strict';

const log               = require('../../../src/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../example/models/config');

knex.init(config);

let man;

let manc;

let manm;

beforeAll(async () => {

    manc    = knex().model.common;

    man     = knex().model.users;

    manm    = knex().model.many;

    await clear();
});

afterAll(async () => {

    await clear();

    await man.destroy();
});

const clear = async () => {

    await manc.raw(`truncate many`);
};

it(`knex - mysql - find`, async done => {

    const {created, updated, roles, config, ...rest} = await man.find(1);

    expect(rest).toEqual({
        "email": "admin@gmail.com",
        "enabled": true,
        "firstName": "admin",
        "id": 1,
        "lastName": "admin",
        "password": "adminpass"
    });

    done();
});

it(`knex - mysql - find with custom select`, async done => {

    const data = await man.find(1, 'lastName, firstName');

    expect(data).toEqual({
        "lastName": "admin",
        "firstName": "admin",
        "roles": [], // still output data are warmed up by fromDb()
    });

    done();
});


