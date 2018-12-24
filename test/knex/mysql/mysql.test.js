'use strict';

const log               = require('@stopsopa/knex-abstract/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

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

it('knex - mysql', async done => {

    const list = await man.query(true, 'show databases');

    let tmp = list.map(x => Object.values(x)[0]);

    const db = process.env.PROTECTED_MYSQL_DB;

    if (db) {

        const found = tmp.find(x => x === db);

        // man.destroy();

        expect(found).toEqual(db);

        done();
    }
});

it(`knex - mysql - shouldn't be alone`, async done => {

    try {

        await man.query(true);
    }
    catch (e) {

        expect(e + '').toEqual(`First argument is bool but it shouldn't be the only argument`);

        done();
    }
});

it(`knex - mysql - init`, async done => {

    const init = await manc.initial();

    expect(init).toEqual({prototype:'MYSQL: prototype.initial()'});

    done();
});

it(`knex - mysql - fromDb`, async done => {

    const init = await manc.fromDb({test: true});

    expect(init).toEqual({test: true});

    done();
});

it(`knex - mysql - toDb`, async done => {

    const init = await manc.toDb({test: true});

    expect(init).toEqual({test: true});

    done();
});

it(`knex - mysql - queryColumn, array params`, async done => {

    const lastName = await man.queryColumn('select lastName from :table: u where u.:id: = ?', [1]);

    expect(lastName).toEqual('admin');

    done();
});

it(`knex - mysql - queryColumn, array params, one param is also array`, async done => {

    const data = await man.query('select lastName from :table: u where u.:id: in (?)', [[1, 2]]);

    expect(data).toEqual([
        {"lastName": "admin"},
        {"lastName": "user"}
    ]);

    done();
});

it(`knex - mysql - count`, async done => {

    const data = await man.count();

    expect(data).toEqual(2);

    done();
});