"use strict";

const log = require("inspc");

const knex = require('knex-abstract');

require("dotenv-up")(4, false, "tests");

const config = require("../../../models/config");

knex.init(config);

it("knex - db exist", (done) => {
  (async function () {
    const users = knex().model.users;

    const list = await users.query({}, "show databases");

    let tmp = list.map((x) => Object.values(x)[0]);

    const db = process.env.MYSQL_DB;

    if (db) {
      const found = tmp.find((x) => x === db);

      expect(found).toEqual(db);

      users.destroy();

      done();
    }
  })();
});
