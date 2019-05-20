
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

module.exports = knex => extend(knex, prototype, {
    fromDb: async function (row, opt, trx) {

        if (opt.opt) {

            row.fromDb = true;
        }

        return null;
    },
}, 'users', 'id');