"use strict";

const log = require("inspc");

const knex = require("knex-abstract");

require("dotenv-up")(5, false, "tests");

const config = require("../../../../models/config");

delete config.def;

it("knex - no def", (done) => {
  (async function () {
    try {
      knex.init(config);
    } catch (e) {
      expect(String(e)).toEqual(
        "Error: knex-abstract: Not 'def' connection specified: 'config.js' for knex key 'knex.def'"
      );

      done();
    }
  })();
});
