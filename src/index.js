
const knex          = require('./knex');

const extend        = require('./extend');

const mysql         = require('./mysql');

const Opt           = require('./Opt');

const promiseall    = require('nlab/promiseall');

knex.extend         = extend;

knex.prototype      = mysql;

knex.Opt            = Opt;

knex.promiseall     = promiseall;

module.exports      = knex;