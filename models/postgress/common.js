const abstract = require('knex-abstract');

const extend = abstract.extend;

const prototype = abstract.prototype_common;

module.exports = (knex) => extend(knex, prototype, {});
