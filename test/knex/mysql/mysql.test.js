'use strict';

const log = require('inspc');

const knex = require('knex-abstract');

require('dotenv-up')(4, false, 'tests');

const config = require('../../../models/config');

knex.init(config);

let man;

let manc;

let manm;

beforeAll(async () => {
  manc = knex().model.common;

  man = knex().model.users;

  manm = knex().model.many;

  await clear();
});

afterAll(async () => {
  await clear();

  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `truncate many`);
};

it('knex - wrong mana', (done) => {
  (async function () {
    try {
      knex().model.nonexisting.test();
    } catch (e) {
      expect(String(e)).toBe(
        "Error: No such mysql manager 'nonexisting', registered managers are: common, users, many, wrongTest"
      );

      done();
    }
  })();
});

it('knex - mysql', (done) => {
  (async function () {
    const list = await man.query({}, 'show databases');

    let tmp = list.map((x) => Object.values(x)[0]);

    const db = process.env.MYSQL_DB;

    if (db) {
      const found = tmp.find((x) => x === db);

      // man.destroy();

      expect(found).toEqual(db);

      done();
    }
  })();
});

it(`knex - mysql - init`, (done) => {
  (async function () {
    const init = await manc.initial({});

    expect(init).toEqual({prototype: 'MYSQL: prototype.initial()'});

    done();
  })();
});

it(`knex - mysql - fromDb`, (done) => {
  (async function () {
    const init = await manc.fromDb({}, {test: true});

    expect(init).toEqual({test: true});

    done();
  })();
});

it(`knex - mysql - toDb`, (done) => {
  (async function () {
    const init = await manc.toDb({}, {test: true});

    expect(init).toEqual({test: true});

    done();
  })();
});

it(`knex - mysql - queryColumn, array params`, (done) => {
  (async function () {
    const lastName = await man.queryColumn({}, 'select lastName from :table: u where u.:id: = ?', [1]);

    expect(lastName).toEqual('admin');

    done();
  })();
});

it(`knex - mysql - queryColumn, array params, one param is also array`, (done) => {
  (async function () {
    const data = await man.query({}, 'select lastName from :table: u where u.:id: in (?)', [[1, 2]]);

    expect(data).toEqual([{lastName: 'admin'}, {lastName: 'user'}]);

    done();
  })();
});

it(`knex - mysql - count`, (done) => {
  (async function () {
    const data = await man.count({});

    expect(data).toEqual(2);

    done();
  })();
});
