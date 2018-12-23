'use strict';

const log               = require('../../../log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../example/models/config');

knex.init(config);

let man;

let manc;

beforeAll(() => {

    manc = knex().model.common;

    man = knex().model.users;
});

afterAll(() => {

   man.destroy();
});

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

it(`knex - mysql - findAll`, async done => {

    const data = await man.findAll();

    const map = data.map(a => {

        const {created, updated, roles, config, enabled, id, firstName, lastName, ...rest} = a;

        return rest;
    });

    expect(map).toEqual([
        {"email": "admin@gmail.com", "password": "adminpass"},
        {"email": "user@gmail.com", "password": "password1234"},
    ]);

    done();
});