
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

module.exports = knex => extend(knex, prototype, {
    fromDb: row => {
        return null;
    },
}, 'users', 'id');