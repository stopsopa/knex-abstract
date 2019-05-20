
const knex      = require('./knex');

const extend    = require('./extend');

const mysql     = require('./mysql');

const Opt       = require('./Opt');

knex.extend     = extend;

knex.prototype  = mysql;

knex.Opt        = Opt;

module.exports  = knex;