
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

// const a             = prototype.a;

module.exports = knex => extend(knex, prototype, {

});