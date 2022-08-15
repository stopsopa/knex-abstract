"use strict";

const log = require("inspc");

const knex = require('knex-abstract');

require("dotenv-up")(4, false, "tests");

const config = require("../../../models/config");

knex.init(config);

let man;

let manc;

let manm;

let connection;

beforeAll(async () => {
  connection = knex("pg");

  manc = connection.model.common;

  man = connection.model.users;

  manm = connection.model.many;

  await clear();
});

afterAll(async () => {
  await clear();

  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `TRUNCATE TABLE many RESTART IDENTITY`);

  await man.raw({}, `delete from :table: where password like 'trans%'`);
};

beforeEach(clear);

afterEach(clear);

it(`knex - no transaction`, (done) => {
  (async function () {
    await man.insert(
      {},
      {
        firstName: "trans f a",
        lastName: "trans l a",
        email: "transa@gmail.com",
        password: "transa",
      }
    );

    try {
      await man.insert(
        {},
        {
          firstName__k: "trans f b",
          lastName: "trans l b",
          email: "transb@gmail.com",
          password: "transb",
        }
      );
    } catch (e) {
      expect(String(e)).toContain("does not exist"); // column XXX of relation XXX does not exist

      const count = await man.queryColumn({}, `select count(*) c from :table: where password in (?)`, [
        ["transa", "transb"],
      ]);

      expect(count).toBe("1");

      done();
    }
  })();
});

it(`knex - transaction ON`, (done) => {
  (async function () {
    try {
      await connection.transaction(async (trx) => {
        await man.insert(
          { trx },
          {
            firstName: "trans f a",
            lastName: "trans l a",
            email: "transa@gmail.com",
            password: "transa",
          }
        );

        await man.insert(
          { trx },
          {
            firstName__k: "trans f b",
            lastName: "trans l b",
            email: "transb@gmail.com",
            password: "transb",
          }
        );
      });
    } catch (e) {
      expect(String(e)).toContain("does not exist");

      const count = await man.queryColumn({}, `select count(*) c from :table: where password in (?)`, [
        ["transa", "transb"],
      ]);

      expect(count).toBe("0");

      done();
    }
  })();
});
