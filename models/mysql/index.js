
const common    = require('./common');

const users     = require('./users');

const many      = require('./many');

const wrongTest = require('./wrongTest');

const managers = {
    common,
    users,
    many,
    wrongTest,
};
/**
 * http://2ality.com/2014/12/es6-proxies.html
 */
module.exports = new Proxy(managers, {
    get(target, propKey, receiver) {

        if (typeof target[propKey] !== 'undefined') {

            return target[propKey];
        }

        const keys = Object.keys(target).filter(a => a !== 'props');

        throw new Error(`No such manager '${propKey}', registered managers are: ` + keys.join(', '));
    }
});
