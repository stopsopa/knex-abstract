const abstract = require('knex-abstract');

const extend = abstract.extend;

const prototype = abstract.prototype_common;

const log = require('inspc');

module.exports = (knex) =>
  extend(
    knex,
    prototype,
    {
      fromDb: async function (opt, rows) {
        if (opt.opt) {
          return rows.map((r) => {
            r.fromDb = true;
            return r;
          });
        }

        return null;
      },
    },
    'users',
    'id'
  );
