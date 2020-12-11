'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(4, false, 'tests');

const config            = require('../../../models/config');

knex.init(config);

let man;

let manc;

let manm;

let connection;

beforeAll(async () => {

    connection = knex();

    manc    = connection.model.common;

    man     = connection.model.users;

    manm    = connection.model.many;

    await clear();
});

afterAll(async () => {

    await clear();

    await man.destroy();
});

const clear = async () => {

    await manc.raw(`truncate many`);
};

beforeEach(clear);

it(`knex - no transactify`, async done => {

    const id = await manm.transactifytest('title1');

    expect(id).toEqual(1);

    const list = await manm.findAll();

    expect(list).toEqual([
        {
            title: 'title1',
            id: 1,
            user_id: null,
        },
        {
            title: 'title1_l1',
            id: 2,
            user_id: null,
        },
        {
            title: 'title1_l1_l2',
            id: 3,
            user_id: null,
        },
    ]);

    done();
});

it(`knex - no transactify`, async done => {

    let id;

    await connection.transaction(async trx => {

        id = await manm.transactifytest(trx, 'title1');
    });

    expect(id).toEqual(1);

    const list = await manm.findAll();

    expect(list).toEqual([
        {
            title: 'title1',
            id: 1,
            user_id: null,
        },
        {
            title: 'title1_l1',
            id: 2,
            user_id: null,
        },
        {
            title: 'title1_l1_l2',
            id: 3,
            user_id: null,
        },
    ]);

    done();
});

it(`knex - transactify - no function given`, async done => {

    try {

        await manm.transactify(false, 'test');
    }
    catch (e) {

        expect(String(e)).toEqual("Error: many.js error: transactify: logic is not a function");

        done();
    }
});
