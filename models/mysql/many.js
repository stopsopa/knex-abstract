
const abstract          = require('@stopsopa/knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('@stopsopa/knex-abstract/log/logn');

const a                 = prototype.a;

module.exports = knex => extend(knex, prototype, {
}, 'many', 'id');