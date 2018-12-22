
module.exports = function extend(knex, prototype, more = {}, ...rest) {

    if (typeof prototype !== 'function') {

        throw `extend: protptype is not a function, it is: ` + (typeof prototype);
    }

    function cache() {

        prototype.apply(this, arguments);
    }

    cache.prototype = Object.create(prototype.prototype);

    cache.prototype.constructor = cache;

    Object.assign(cache.prototype, more);

    cache.prototype.props = Object.keys(cache.prototype).reduce((acc, key) => {
        acc[key] = typeof cache.prototype[key];
        return acc;
    }, {});

    return new cache(knex, ...rest);
}