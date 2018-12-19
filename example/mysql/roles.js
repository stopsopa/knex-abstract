
const extend = require('../extend');

const prototype = require('./prototype');

module.exports = knex => extend(knex, prototype, {

}, 'roles', 'id');