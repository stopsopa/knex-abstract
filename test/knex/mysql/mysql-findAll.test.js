'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(4, false, 'tests');

const config            = require('../../../models/config');

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

it(`knex - mysql - findAll`, async done => {

    const data = await man.findAll();

    const map = data.map(a => {

        const {created, updated, roles, config, enabled, id, firstName, lastName, password, ...rest} = a;

        return rest;
    });

    expect(map).toEqual([
        {
            "email": "admin@gmail.com",
            // "password": "adminpass"
        },
        {
            "email": "user@gmail.com",
            // "password": "password1234"
        },
    ]);

    done();
});


