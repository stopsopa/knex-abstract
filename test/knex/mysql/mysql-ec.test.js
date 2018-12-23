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

it('knex - mysql ec - no query', async done => {

    try {

        await man.query();
    }
    catch (e) {

        expect(e + '').toEqual("query 'undefined' is not a string");

        done();
    }
});

it(`knex - mysql - exc 1`, async done => {

    try {

        await man.query('select ? from :table: u where u.:id: in (:test)', ['lastName', [1, 2]]);
    }
    catch (e) {

        expect(e + '').toEqual("If params given as an array then you can't use other named binding then ':id:' and ':table:'");

        done();
    }
});

it(`knex - mysql - exc 2`, async done => {

    try {

        await man.query('select ?? from :table: u where u.:id: in (:test)', ['lastName', [1, 2]]);
    }
    catch (e) {

        expect(e + '').toEqual("If params given as an array then you can't use other named binding then ':id:' and ':table:'");

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

        expect(e + '').toContain('ER_PARSE_ERROR');

        done();
    }
});

it(`knex - mysql - ER_PARSE_ERROR, array params`, async done => {

    try {

        await man.queryColumn('select email from :table: :table: u where lastName = ?', ['admin']);
    }
    catch (e) {

        expect(e + '').toContain('ER_PARSE_ERROR');

        done();
    }
});

it(`knex - mysql - queryOne, error`, async done => {

    try {

        await man.queryOne('select email from :table: u where lastName = ?', ['xyz']);
    }
    catch (e) {

        expect(e + '').toContain('found 0 rows');

        done();
    }
});

it(`knex - mysql - queryOne, table reserved`, async done => {

    try {

        await man.queryOne('select email from :table: u where lastName = :p1', {__table: 'users', p1: 'xyz'});
    }
    catch (e) {

        expect(e + '').toEqual(`Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter '__table' manually`);

        done();
    }
});

it(`knex - mysql - queryOne, table used but on common`, async done => {

    try {

        await manc.queryOne('select email from :table: u where lastName = :p1');
    }
    catch (e) {

        expect(e + '').toEqual("this.__table not specified");

        done();
    }
});


it(`knex - mysql - queryOne, id reserved`, async done => {

    try {

        await man.queryOne('select email from :id: u where lastName = :p1', {__id: 'users', p1: 'xyz'});
    }
    catch (e) {

        expect(e + '').toEqual(`Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter '__id' manually`);

        done();
    }
});

it(`knex - mysql - queryOne, id used but on common`, async done => {

    try {

        await manc.queryOne('select email from :id: u where lastName = :p1');
    }
    catch (e) {

        expect(e + '').toEqual("this.__id not specified");

        done();
    }
});

it(`knex - mysql - queryOne, missing param`, async done => {

    try {

        await man.queryOne('select email from :table: where lastName = :p1', {});
    }
    catch (e) {

        expect(e + '').toEqual("Query: 'select email from :table: where lastName = :p1' error: value for parameter 'p1' is missing on the list of given parameter: {\"__table\":\"users\"}");

        done();
    }
});

it(`knex - mysql - find, error - not string select`, async done => {

    try {

        await man.find(1, 56);
    }
    catch (e) {

        expect(e).toEqual("second argument of find method should be string");

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

