"use strict";

const log = require("inspc");

const knex = require("knex-abstract");

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

it(`knex - postgres - delete`, (done) => {
  (async function () {
    await manm.insert(
      {},
      {
        title: "test",
      }
    );

    const affectedRows = await manm.delete({}, 1);

    expect(affectedRows).toEqual(1);

    const all = await manm.findAll({});

    expect(all).toEqual([]);

    done();
  })();
});

it(`knex - postgres - delete, [1, 3]`, (done) => {
  (async function () {
    await manm.insert(
      {},
      {
        title: "test1",
      }
    );

    await manm.insert(
      {},
      {
        title: "test2",
      }
    );

    await manm.insert(
      {},
      {
        title: "test3",
      }
    );

    const affectedRows = await manm.delete({}, [1, 3]);

    expect(affectedRows).toEqual(2);

    const all = await manm.findAll({});

    expect(all).toEqual([{ id: 2, title: "test2", user_id: null }]);

    done();
  })();
});
