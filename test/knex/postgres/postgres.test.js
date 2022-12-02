"use strict";

const log = require("inspc");

const knex = require('knex-abstract');

require("dotenv-up")(4, false, "tests");

const config = require("../../../models/config");

knex.init(config);

let man;

let manc;

let manm;

beforeAll(async () => {
  manc = knex("pg").model.common;

  man = knex("pg").model.users;

  manm = knex("pg").model.many;
});

afterAll(async () => {
  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `truncate many`);
};

it("knex - wrong manager", (done) => {
  (async function () {
    try {
      knex("pg").model.nonexisting.test();
    } catch (e) {
      expect(String(e)).toBe(
        "Error: No such pg manager 'nonexisting', registered managers are: common, users, many, wrongTest"
      );

      done();
    }
  })();
});

it("knex - postgres", (done) => {
  (async function () {
    const list = await man.query({}, "SELECT datname FROM pg_database WHERE datistemplate = false");

    let tmp = list.map((x) => Object.values(x)[0]);

    const db = process.env.PROTECTED_PG_DB;

    if (db) {
      const found = tmp.find((x) => x === db);

      // man.destroy();

      expect(found).toEqual(db);

      done();
    }
  })();
});

it(`knex - postgres - init`, (done) => {
  (async function () {
    const init = await manc.initial({});

    expect(init).toEqual({ prototype: "MYSQL: prototype.initial()" });

    done();
  })();
});

it(`knex - postgres - fromDb`, (done) => {
  (async function () {
    const init = await manc.fromDb({}, [{ test: true }]);

    expect(init).toEqual([{ test: true }]);

    done();
  })();
});

it(`knex - postgres - toDb`, (done) => {
  (async function () {
    const init = await manc.toDb({}, { test: true });

    expect(init).toEqual({ test: true });

    done();
  })();
});

it(`knex - postgres - fetchColumn, array params`, (done) => {
  (async function () {
    const lastName = await man.fetchColumn({}, 'select "lastName" from :table: u where u.:id: = ?', [1]);

    expect(lastName).toEqual("admin");

    done();
  })();
});

it(`knex - postgres - fetchColumn, array params, one param is also array`, (done) => {
  (async function () {
    const data = await man.query({}, 'select "lastName" from :table: u where u.:id: in (?)', [[1, 2]]);

    expect(data).toEqual([{ lastName: "admin" }, { lastName: "user" }]);

    done();
  })();
});

it(`knex - postgres - count`, (done) => {
  (async function () {
    const data = await man.count({});

    expect(data).toEqual(2);

    done();
  })();
});
