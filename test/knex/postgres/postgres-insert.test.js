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

beforeEach(clear);

it(`knex - postgres - insert`, (done) => {
  (async function () {
    await manm.insert(
      {},
      {
        title: "test",
      }
    );

    const id = await manm.insert(
      {},
      {
        title: "test",
      }
    );

    expect(id).toEqual(2);

    done();
  })();
});

it(`knex - postgres - insert, hasOwnProperty`, (done) => {
  (async function () {
    await manm.insert(
      {},
      {
        title: "test",
      }
    );

    const a = function () {};
    a.prototype.other = "other";

    const b = function (t) {
      this.title = t;
    };

    b.prototype = Object.create(a.prototype);

    b.prototype.constructor = b;

    const c = new b("custom");

    const id = await manm.insert({}, c);

    expect(id).toEqual(2);

    const count = await manm.count({});

    expect(count).toEqual(2);

    done();
  })();
});
