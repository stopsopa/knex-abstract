'use strict';

const log = require('inspc');

const knex = require('knex-abstract');

require('dotenv-up')(5, false, 'tests');

// const config            = require('../../../../models/config');

it('knex - init wrong config - part 1', (done) => {
  (async function () {
    try {
      knex.init();
    } catch (e) {
      expect(String(e)).toEqual('Error: knex-abstract: init(config), config has to be an object');

      done();
    }
  })();
});

it('knex - init wrong config - part 2', (done) => {
  (async function () {
    try {
      knex.init(true);
    } catch (e) {
      expect(String(e)).toEqual('Error: knex-abstract: init(config), config has to be an object');

      done();
    }
  })();
});

it('knex - init wrong config - part 3', (done) => {
  (async function () {
    try {
      knex.init({});
    } catch (e) {
      expect(String(e)).toEqual(
        "Error: knex-abstract: key 'knex' is an object but there is not connections defined in it"
      );

      done();
    }
  })();
});
