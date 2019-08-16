

const isObject          = require('nlab/isObject');

/**
 * http://2ality.com/2014/12/es6-proxies.html
 *
 * isProxy field introduced because util.types.isProxy is only available from node 10:
 *      https://nodejs.org/api/util.html#util_util_types_isproxy_value
 */
function Opt(opt) {

    if ( this instanceof Opt ) {

        throw new Error(`knex-abstract: don't use 'new' operator with Opt() object, just use it as a function`);
    }

    if ( isObject(opt) ) {

        if (opt.isProxy) {

            return opt;
        }
    }
    else {

        if ( typeof opt !== 'boolean' ) {

            throw new Error(`knex-abstract: new Opt(opt) opt is not object nor boolean`);
        }

        opt = {
            debug: opt,
        }
    }

    return {
        ...opt,
        isProxy : true,
    };
}

module.exports = Opt;