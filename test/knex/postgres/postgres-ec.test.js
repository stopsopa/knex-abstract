"use strict";

const log = require("inspc");

const knex = require('knex-abstract');

require("dotenv-up")(4, false, "tests");

const config = require("../../../models/config");

knex.init(config);

let man;

let manc;

beforeAll(() => {
  manc = knex("pg").model.common;

  man = knex("pg").model.users;
});

afterAll(() => {
  man.destroy();
});

it("knex - postgres ec - no query", (done) => {
  (async function () {
    try {
      await man.query({});
    } catch (e) {
      expect(String(e)).toEqual("Error: users.js error: query 'undefined' is not a string");

      done();
    }
  })();
});

it(`knex - postgres - exc 1`, (done) => {
  (async function () {
    try {
      await man.query({}, "select ? from :table: u where u.:id: in (:test)", ["lastName", [1, 2]]);
    } catch (e) {
      expect(String(e)).toEqual(
        "Error: users.js error: If params given as an array then you can't use other named binding then ':id:' and ':table:'"
      );

      done();
    }
  })();
});

it(`knex - postgres - exc 2`, (done) => {
  (async function () {
    try {
      await man.query({}, "select ?? from :table: u where u.:id: in (:test)", ["lastName", [1, 2]]);
    } catch (e) {
      expect(String(e)).toEqual(
        "Error: users.js error: If params given as an array then you can't use other named binding then ':id:' and ':table:'"
      );

      done();
    }
  })();
});

it(`knex - postgres - exc semi`, (done) => {
  (async function () {
    const data = await man.query({}, "select :p1: from :table: u where :id: in (:p2)", {
      p1: "lastName",
      p2: [1, 2],
    });

    expect(data).toEqual([{ lastName: "admin" }, { lastName: "user" }]);

    done();
  })();
});

it(`knex - postgres - wrong fromDb`, (done) => {
  (async function () {
    try {
      await knex("pg").model.wrongTest.fetchColumn({}, 'select email from :table: u where "lastName" = :p1', {
        p1: "admin",
      });

      done("wrong");
    } catch (e) {
      expect(String(e)).toEqual("Error: users.js error: fetchOne error: rows is not an array");

      done();
    }
  })();
});

it(`knex - postgres - exc not semi`, (done) => {
  (async function () {
    const data = await man.fetchColumn({}, 'select email from :table: u where "lastName" = :p1', {
      p1: "admin",
    });

    expect(data).toEqual("admin@gmail.com");

    done();
  })();
});

it(`knex - postgres - "syntax error at or near", object params`, (done) => {
  (async function () {
    try {
      await man.fetchColumn({}, 'select email from :table: :table: u where "lastName" = :p1', {
        p1: "admin",
      });
    } catch (e) {
      expect(String(e)).toContain("syntax error at or near");

      done();
    }
  })();
});

it(`knex - postgres - "syntax error at or near", array params`, (done) => {
  (async function () {
    try {
      await man.fetchColumn({}, 'select email from :table: :table: u where "lastName" = ?', ["admin"]);
    } catch (e) {
      expect(String(e)).toContain("syntax error at or near");

      done();
    }
  })();
});

it(`knex - postgres - fetchOne - more then one`, (done) => {
  (async function () {
    try {
      const find = await manc.fetchOne({}, "select * from roles where name in (?)", [["admin", "user"]]);
    } catch (e) {
      expect(String(e)).toEqual("found 2 rows, fetchOne is designed to fetch first from only one row");

      done();
    }
  })();
});
it(`knex - postgres - fetchOne, error`, (done) => {
  (async function () {
    const one = await man.fetchOne({}, 'select email from :table: u where "lastName" = ?', ["xyz"]);

    expect(one).toEqual(undefined);

    done();
  })();
});

it(`knex - postgres - fetchOne, table reserved`, (done) => {
  (async function () {
    try {
      await man.fetchOne({}, 'select email from :table: u where "lastName" = :p1', { __table: "users", p1: "xyz" });
    } catch (e) {
      expect(String(e)).toEqual(
        "Error: users.js error: Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter '__table' manually"
      );

      done();
    }
  })();
});

it(`knex - postgres - fetchOne, table used but on common`, (done) => {
  (async function () {
    try {
      await manc.fetchOne({}, 'select email from :table: u where "lastName" = :p1');
    } catch (e) {
      expect(String(e)).toEqual("Error: index.js error: this.__table not specified");

      done();
    }
  })();
});

it(`knex - postgres - fetchOne, id reserved`, (done) => {
  (async function () {
    try {
      await man.fetchOne({}, 'select email from :id: u where "lastName" = :p1', { __id: "users", p1: "xyz" });
    } catch (e) {
      expect(String(e)).toEqual(
        "Error: users.js error: Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter '__id' manually"
      );

      done();
    }
  })();
});

it(`knex - postgres - fetchOne, id used but on common`, (done) => {
  (async function () {
    try {
      await manc.fetchOne({}, 'select email from :id: u where "lastName" = :p1');
    } catch (e) {
      expect(String(e)).toEqual("Error: index.js error: this.__id not specified");

      done();
    }
  })();
});

it(`knex - postgres - fetchOne, missing param`, (done) => {
  (async function () {
    try {
      await man.fetchOne({}, 'select email from :table: where "lastName" = :p1', {});
    } catch (e) {
      expect(String(e)).toEqual(
        'Error: users.js error: Query: \'select email from :table: where "lastName" = :p1\' error: value for parameter \'p1\' is missing on the list of given parameters: {"__table":"users"}'
      );

      done();
    }
  })();
});

it(`knex - postgres - find, error - not string select`, (done) => {
  (async function () {
    try {
      await man.find({}, 1, 56);
    } catch (e) {
      expect(String(e)).toEqual("Error: users.js error: second argument of find method should be string");

      done();
    }
  })();
});

it("knex - postgres, log.dump but in array params case", (done) => {
  (async function () {
    const list = await man.query({}, "SELECT datname FROM pg_database WHERE datistemplate = false;", []);

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
