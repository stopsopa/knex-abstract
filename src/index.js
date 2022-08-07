const knex = require('./knex');

const extend = require('./extend');

const promiseall = require('nlab/promiseall');

knex.extend = extend;

knex.prototype_common = require('./prototype_common');

knex.promiseall = promiseall;

module.exports = knex;
