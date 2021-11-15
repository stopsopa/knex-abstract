
const common                    = require('./common');

const users                     = require('./users');

const tree                      = require('./tree');

const managers = {
    common,
    users,
    tree,
};

/**
 * http://2ality.com/2014/12/es6-proxies.html
 */
module.exports = new Proxy(managers, {
    get(target, propKey, receiver) {

        if (typeof target[propKey] !== 'undefined') {

            return target[propKey];
        }

        const keys = Object.keys(target);

        throw new Error(`No such mysql manager '${propKey}', registered managers are: ` + keys.join(', '));
    },
});

