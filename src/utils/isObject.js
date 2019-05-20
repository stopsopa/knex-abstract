
function isObject(a) {
    // return (!!a) && (a.constructor === Object);
    return Object.prototype.toString.call(a) === "[object Object]";
};

module.exports = isObject;