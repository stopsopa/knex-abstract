
const knex              = require('@stopsopa/knex-abstract');

const config            = require('./models/config');

knex.init(config);

(async function () {

    const man       = knex().model.common;

    const databases = await man.query(`show databases`);

    console.log(JSON.stringify(databases, null, 4));

    man.destroy();
}());

