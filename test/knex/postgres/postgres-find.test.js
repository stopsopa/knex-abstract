"use strict";

const log = require("inspc");

const knex = require("../../../src");

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

  await clear();
});

afterAll(async () => {
  await clear();

  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `TRUNCATE TABLE many RESTART IDENTITY`);
};

it(`knex - postgres - find`, (done) => {
  (async function () {
    const { created, updated, roles, config, password, ...rest } = await man.find({}, 1);

    expect(rest).toEqual({
      email: "admin@gmail.com",
      enabled: true,
      firstName: "admin",
      id: 1,
      lastName: "admin",
      // "password": "adminpass"
    });

    done();
  })();
});

it(`knex - postgres - find with custom select`, (done) => {
  (async function () {
    const data = await man.find({}, 1, '"lastName", "firstName"');

    expect(data).toEqual({
      lastName: "admin",
      firstName: "admin",
      roles: [], // still output data are warmed up by fromDb()
    });

    done();
  })();
});
