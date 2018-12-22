
/**
 * require('@stopsopa/knex-abstract').init();
 */

//import configServer from 'server.config';

const log = require('../log/logn');

let connections = false;

function isObject(a) {

    return (!!a) && (a.constructor === Object);
};

// import models from 'models';

let config = false;

const extend = (knex, name) => {

    const models = Object.entries(config)
        .filter(([key]) => key !== 'def')
        .reduce((acc, k) => {

            const { models, ...cc } =  k[1];

            acc[k[0]] = models;

            return acc;
        }, {});

    if (models[name]) {

        knex.model = Object.keys(models[name]).reduce((a, key) => {

            a[key] = models[name][key](knex);

            return a;

        }, {});

        knex.model.props = Object.keys(knex.model).reduce((acc, key) => {

            acc[key] = typeof knex.model[key];

            return acc;
        }, {});
    }
    else {

        throw `key '${name}' defined under server.config -> 'knex' config but there is no models defined for it`;
    }
}


/**
 * https://knexjs.org/#Installation-client
 */
const tool = name => {

    if (config === false) {

        throw `Before use require('@stopsopa/knex-abstract')() first use require('@stopsopa/knex-abstract').init(config) and pass config`
    }

    if ( ! name ) {

        name = config.def;
    }

    if ( ! config[name]) {

        throw `knex.js: Connection '${name}' is not defined in config.js under 'knex' key`;
    }

    return connections[name];
};

tool.init = c => {

    if (connections !== false) {

        return `knex.js: Connections are already initialized, no need to call init() again`;
    }

    if ( ! c || ! isObject(c) ) {

        throw `knex.js: init(config), config has to be an object`;
    }

    const keys = Object.keys(c);

    if ( ! keys.length ) {

        throw `knex.js: key 'knex' is an object but there is not connections defined in it`;
    }

    if (typeof c.def !== 'string') {

        throw `knex.js: Not 'def' connection specified: 'config.js' for knex key 'knex.def'`;
    }

    config = c;

    connections = keys.filter(c => c !== 'def').reduce((acc, name) => {

        const { models, ...cc } = c[name];

        acc[name] = eval('require')('knex')(cc);

        extend(acc[name], name);

        return acc;
    }, {});

    return 0;
};

module.exports = tool;