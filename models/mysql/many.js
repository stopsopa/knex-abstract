
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

module.exports = knex => extend(knex, prototype, {
    transactifytest: async function (...args) {

        let [debug, trx, title] = a(args);

        const id = await this.insert(debug, trx, {
            title,
        });

        await this.transactifytest2(debug, trx, title + '_l1');

        return id;
    },
    transactifytest2: async function (...args) {

        let [debug, trx, title] = a(args);

        const id = await this.insert(debug, trx, {
            title,
        });

        await this.transactifytest3(debug, trx, title + '_l2');

        return id;
    },
    transactifytest3: async function (...args) {

        let [debug, trx, title] = a(args);

        let id;

        await this.transactify(trx, async trx => {

            id = await this.insert(debug, trx, {
                title,
            });
        });

        return id;
    },
}, 'many', 'id');