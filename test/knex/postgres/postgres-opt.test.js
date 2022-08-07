'use strict';

const log = require('inspc');

const knex = require('knex-abstract');

const {Opt} = knex;

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

const firstName = 'mysql-opt-test';

afterAll(async () => {
  await clear();

  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `TRUNCATE TABLE many RESTART IDENTITY`);

  await man.query({}, `delete from :table: where "firstName" = :firstName`, {
    firstName,
  });
};

beforeEach(clear);

it(`knex - postgres - opt`, (done) => {
  (async function () {
    await man.transactify(async (trx) => {
      const opt = {
        test1: firstName,
        trx,
      };

      const id = await man.insert(opt, {
        firstName,
        lastName: 'a',
        password: 'p',
        email: 'e',
      });

      const entity = await man.find(opt, id);

      expect(entity).toEqual({
        // "config": null,
        email: 'e',
        enabled: false,
        extraFromDb: true,
        firstName,
        lastName: 'test1-lastName',
        password: 'p',
      });

      const count = await man.queryColumn(opt, 'select count(id) c from :table: where "firstName" = :firstName', {
        firstName,
      });

      expect(count).toEqual('2');
    });

    done();
  })();
});

it(`knex - postgres - opt - beyond`, (done) => {
  (async function () {
    await man.transactify(async (trx) => {
      const opt = {
        test1: firstName,
        trx,
      };

      const id = await man.insert(opt, {
        firstName,
        lastName: 'a',
        password: 'p',
        email: 'e',
      });

      const entity = await man.find(opt, id);

      expect(entity).toEqual({
        // "config": null,
        email: 'e',
        enabled: false,
        extraFromDb: true,
        firstName,
        lastName: 'test1-lastName',
        password: 'p',
      });

      const count = await man.queryColumn(opt, 'select count(id) c from :table: where "firstName" = :firstName', {
        firstName,
      });

      expect(count).toEqual('2');
    });

    // and now beyond transaction
    const count = await man.queryColumn({}, 'select count(id) c from :table: where "firstName" = :firstName', {
      firstName,
    });

    expect(count).toEqual('2');

    done();
  })();
});

it(`knex - postgres - opt - beyond with trans error`, (done) => {
  (async function () {
    try {
      await man.transactify(async (trx) => {
        const opt = {
          test1: firstName,
          trx,
        };

        const id = await man.insert(opt, {
          firstName,
          lastName: 'a',
          password: 'p',
          email: 'e',
        });

        const entity = await man.find(opt, id);

        expect(entity).toEqual({
          // "config": null,
          email: 'e',
          enabled: false,
          extraFromDb: true,
          firstName,
          lastName: 'test1-lastName',
          password: 'p',
        });

        const count = await man.queryColumn(opt, 'select count(id) c from :table: where "firstName" = :firstName', {
          firstName,
        });

        expect(count).toEqual('2');

        await man.query({trx}, `select * from non_existing_table`);
      });
    } catch (e) {}

    // and now beyond transaction
    const count = await man.queryColumn({}, 'select count(id) c from :table: where "firstName" = :firstName', {
      firstName,
    });

    // even rows create in fromDb have been removed
    expect(count).toEqual('0');

    done();
  })();
});
