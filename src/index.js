
const knex      = require('./knex');

const extend    = require('./extend');

const mysql     = require('./mysql');

knex.extend     = extend;

knex.prototype  = mysql;

module.exports  = knex;