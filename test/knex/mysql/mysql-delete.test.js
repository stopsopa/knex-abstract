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

beforeEach(clear);

it(`knex - mysql - delete`, async done => {

    await manm.insert({
        title: 'test'
    });

    const affectedRows = await manm.delete(1);

    expect(affectedRows).toEqual(1);

    const all = await manm.findAll();

    expect(all).toEqual([]);

    done();
});

it(`knex - mysql - delete, [1, 3]`, async done => {

    await manm.insert({
        title: 'test1'
    });

    await manm.insert({
        title: 'test2'
    });

    await manm.insert({
        title: 'test3'
    });

    const affectedRows = await manm.delete([1, 3]);

    expect(affectedRows).toEqual(2);

    const all = await manm.findAll();

    expect(all).toEqual([{"id": 2, "title": "test2", "user_id": null}]);

    done();
});
