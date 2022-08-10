const abstract = require("knex-abstract");

const extend = abstract.extend;

const prototype = abstract.prototype_common;

const log = require("inspc");

module.exports = (knex) =>
  extend(
    knex,
    prototype,
    {
      transactifytest: async function (opt, title) {
        const id = await this.insert(opt, {
          title,
        });

        await this.transactifytest2(opt, title + "_l1");

        return id;
      },
      transactifytest2: async function (opt, title) {
        const id = await this.insert(opt, {
          title,
        });

        await this.transactifytest3(opt, title + "_l2");

        return id;
      },
      transactifytest3: async function (opt, title) {
        let id;

        await this.transactify(opt.trx, async (trx) => {
          id = await this.insert(opt, {
            title,
          });
        });

        return id;
      },
    },
    "many",
    "id"
  );
