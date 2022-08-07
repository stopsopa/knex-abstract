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
  manc = knex('pg').model.common;

  man = knex('pg').model.users;

  manm = knex('pg').model.many;

  await clear();
});

afterAll(async () => {
  await clear();

  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `TRUNCATE TABLE many RESTART IDENTITY`);
};

it(`knex - postgres - findAll`, (done) => {
  (async function () {
    const data = await man.findAll({});

    const map = data.map((a) => {
      const {created, updated, roles, config, enabled, id, firstName, lastName, password, ...rest} = a;

      return rest;
    });

    expect(map).toEqual([
      {
        email: 'admin@gmail.com',
        // "password": "adminpass"
      },
      {
        email: 'user@gmail.com',
        // "password": "password1234"
      },
    ]);

    done();
  })();
});
