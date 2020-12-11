'use strict';

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(4, false, 'tests');

const config            = require('../../../models/config');

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

it('knex - mysql ec - no query', async done => {

    try {

        await man.query();
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: query 'undefined' is not a string");

        done();
    }
});

it(`knex - mysql - exc 1`, async done => {

    try {

        await man.query('select ? from :table: u where u.:id: in (:test)', ['lastName', [1, 2]]);
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: If params given as an array then you can't use other named binding then ':id:' and ':table:'");

        done();
    }
});

it(`knex - mysql - exc 2`, async done => {

    try {

        await man.query('select ?? from :table: u where u.:id: in (:test)', ['lastName', [1, 2]]);
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: If params given as an array then you can't use other named binding then ':id:' and ':table:'");

        done();
    }
});

it(`knex - mysql - exc semi`, async done => {

    const data = await man.query('select :p1: from :table: u where :id: in (:p2)', {
        p1:'lastName',
        p2: [1, 2]
    });

    expect(data).toEqual([
        {"lastName": "admin"},
        {"lastName": "user"}
    ]);

    done();
});

it(`knex - mysql - wrong fromDb`, async done => {

    const data = await knex().model.wrongTest.queryColumn('select email from :table: u where lastName = :p1', {
        p1: 'admin'
    });

    expect(data).toBeUndefined();

    done();
});

it(`knex - mysql - exc not semi`, async done => {

    const data = await man.queryColumn('select email from :table: u where lastName = :p1', {
        p1: 'admin'
    });

    expect(data).toEqual('admin@gmail.com');

    done();
});

it(`knex - mysql - ER_PARSE_ERROR, object params`, async done => {

    try {

        await man.queryColumn('select email from :table: :table: u where lastName = :p1', {
            p1: 'admin'
        });
    }
    catch (e) {

        expect(String(e)).toContain('ER_PARSE_ERROR');

        done();
    }
});

it(`knex - mysql - ER_PARSE_ERROR, array params`, async done => {

    try {

        await man.queryColumn('select email from :table: :table: u where lastName = ?', ['admin']);
    }
    catch (e) {

        expect(String(e)).toContain('ER_PARSE_ERROR');

        done();
    }
});

it(`knex - mysql - queryOne - more then one`, async done => {

    try {

        const find = await manc.queryOne('select * from roles where name in (?)', [['admin', 'user']]);
    }
    catch (e) {

        expect(String(e)).toEqual("found 2 rows, queryOne is designed to fetch first from only one row");

        done();
    }
});

it(`knex - mysql - queryOne, error`, async done => {

    const one = await man.queryOne('select email from :table: u where lastName = ?', ['xyz']);

    expect(one).toEqual(undefined);

    done();
});

it(`knex - mysql - queryOne, error`, async done => {

    const one = await man.queryOne('select email from :table: u where lastName = ?', ['xyz']);

    expect(one).toEqual(undefined);

    done();
});

it(`knex - mysql - queryOne, table reserved`, async done => {

    try {

        await man.queryOne('select email from :table: u where lastName = :p1', {__table: 'users', p1: 'xyz'});
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter '__table' manually");

        done();
    }
});

it(`knex - mysql - queryOne, table used but on common`, async done => {

    try {

        await manc.queryOne('select email from :table: u where lastName = :p1');
    }
    catch (e) {

        expect(String(e)).toEqual("Error: undefined.js error: this.__table not specified");

        done();
    }
});


it(`knex - mysql - queryOne, id reserved`, async done => {

    try {

        await man.queryOne('select email from :id: u where lastName = :p1', {__id: 'users', p1: 'xyz'});
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter '__id' manually");

        done();
    }
});

it(`knex - mysql - queryOne, id used but on common`, async done => {

    try {

        await manc.queryOne('select email from :id: u where lastName = :p1');
    }
    catch (e) {

        expect(String(e)).toEqual("Error: undefined.js error: this.__id not specified");

        done();
    }
});

it(`knex - mysql - queryOne, missing param`, async done => {

    try {

        await man.queryOne('select email from :table: where lastName = :p1', {});
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: Query: 'select email from :table: where lastName = :p1' error: value for parameter 'p1' is missing on the list of given parameters: {\"__table\":\"users\"}");

        done();
    }
});

it(`knex - mysql - find, error - not string select`, async done => {

    try {

        await man.find(1, 56);
    }
    catch (e) {

        expect(String(e)).toEqual("Error: users.js error: second argument of find method should be string");

        done();

    }
});

it('knex - mysql, log.dump but in array params case', async done => {

    const list = await man.query(true, 'show databases', []);

    let tmp = list.map(x => Object.values(x)[0]);

    const db = process.env.PROTECTED_MYSQL_DB;

    if (db) {

        const found = tmp.find(x => x === db);

        // man.destroy();

        expect(found).toEqual(db);

        done();
    }
});

