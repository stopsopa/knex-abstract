
const log = require('@stopsopa/knex-abstract/log/logn');

function isObject(a) {
    // return (!!a) && (a.constructor === Object);
    return Object.prototype.toString.call(a) === "[object Object]";
};

function a(args, noSingle = true) {

    let debug   = false;

    let trx     = false;

    args.forEach(a => {

        const t = typeof a;

        if (t === 'boolean') {

            debug = a;

            if (noSingle && args.length === 1) {

                throw `First argument is bool but it shouldn't be the only argument`;
            }

            return;
        }

        if (t === 'function') {

            trx = a;
        }
    });

    args = args
        .filter(a => typeof a !== 'function')
        .filter(a => typeof a !== 'boolean')
        .filter(a => a !== null)
        .filter(a => a !== undefined)
    ;

    return [debug, trx, ...args];
}

function prototype(knex, table, id) {
    this.knex           = knex;
    this.__table        = table;
    this.__id           = id;
}

prototype.prototype.initial = function () {
    return {prototype:'MYSQL: prototype.initial()'};
}

prototype.prototype.fromDb = async function (row) {
    return row;
}
prototype.prototype.toDb = async function (row) {
    return row;
}

prototype.prototype.raw = function (...args) {

    let [debug, trx, query, params] = a(args);

    if (typeof query !== 'string') {

        throw `query '${query}' is not a string`;
    }

    const instance = trx || this.knex;

    if (Array.isArray(params)) {

        let i = 0;

        query = query.replace(/(?:(?::([0-9a-z_]+)(:?))|(?:\?+))/ig, (all, name) => {

            if (name === undefined) {

                if (Array.isArray(params[i])) {

                    const tmp = params[i];

                    params.splice(i, 1);

                    params.splice(i, 0, ...tmp);

                    i += tmp.length;

                    // log(all, i, JSON.stringify(params));

                    return tmp.map(_ => all).join(',');
                }

                i += 1;

                // log(all, i, JSON.stringify(params));

                return all;
            }

            if (name && (name === 'id' || name === 'table')) {

                name = '__' + name;
            }
            else {

                throw `If params given as an array then you can't use other named binding then ':id:' and ':table:'`;
            }

            params.splice(i, 0, this[name]);

            i += 1;

            // log(all, i, JSON.stringify(params));

            return '??';
        });

        debug && log.dump({
            query,
            params,
        });

        return instance.raw(query, params).catch(e => {

            const error = {
                query,
                params,
                e: (e + ''),
                stack: (e.stack + '').split("\n")
            };

            error.toString = function () {
                return JSON.stringify(this, null, 4);
            };

            return Promise.reject(error);
        });
    }

    if (query.indexOf(':table:') > -1) {

        if ( params && typeof params.__table !== 'undefined' ) {

            throw `Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter '__table' manually`;
        }

        if ( ! isObject(params) ) {

            params = {};
        }

        if ( ! this.__table ) {

            throw `this.__table not specified`
        }

        params.__table = this.__table;
    }

    if (query.indexOf(':id:') > -1) {

        if ( params && typeof params.__id !== 'undefined' ) {

            throw `Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter '__id' manually`;
        }

        if ( ! isObject(params) ) {

            params = {};
        }

        if ( ! this.__id ) {

            throw `this.__id not specified`
        }

        params.__id = this.__id;
    }

    let queryParams = [];

    query = query.replace(/:([0-9a-z_]+)(:?)/ig, (all, name, semi) => {

        if (semi && name && (name === 'id' || name === 'table')) {

            name = '__' + name;
        }

        if ( typeof params[name] === 'undefined') {

            throw `Query: '${query}' error: value for parameter '${name}' is missing on the list of given parameter: ` + JSON.stringify(params);
        }

        const placeholder = semi ? '??' : '?';

        if (Array.isArray(params[name])) {

            queryParams = [...queryParams, ...params[name]];

            return params[name].map(_ => placeholder).join(',')
        }
        else {

            queryParams.push(params[name]);

            return placeholder;
        }
    });

    debug && log.dump({
        query,
        params,
        queryParams,
    });

    return instance.raw(query, queryParams).catch(e => {

        const error = {
            query,
            params,
            queryParams,
            e: (e + ''),
            stack: (e.stack + '').split("\n")
        };

        error.toString = function () {
            return JSON.stringify(this, null, 4);
        };

        return Promise.reject(error);
    });
}

prototype.prototype.query = function (...args) {
    return this.raw(...args).then(result => result[0])
};

prototype.prototype.queryOne = function (...args) {
    return this.query(...args)
        .then(rows => {

            if (rows.length < 2) {

                return rows.pop(); // return first row from result - but only if there is only one
            }

            return Promise.reject('found ' + rows.length + ' rows, queryOne is designed to fetch first from only one row');
        })
            .then(this.fromDb)
        ;
}
prototype.prototype.queryColumn = function (...args) {
    return this.queryOne(...args)
        .then(row => {

            if (isObject(row)) {

                return Object.values(row)[0]; // extract value from first column
            }
        })
    ;
};

prototype.prototype.count = function (...args) {

    const query = 'SELECT COUNT(*) AS c FROM :table:';

    return this.queryColumn(...args, query);
}

prototype.prototype.find = function (...args) {

    let [debug, trx, id, select = '*'] = a(args);

    if (typeof select !== 'string') {

        throw 'second argument of find method should be string';
    }

    return this.queryOne(debug, trx, `SELECT ${select} FROM :table: WHERE :id: = :id`, {
        id,
    })
        .then(this.fromDb)
    ;
};

prototype.prototype.findAll = function (debug, trx) {
    return this.query(debug, trx, `select * from :table: order by :id:`)
        .then(data => Promise.all(data.map(this.fromDb)))
    ;
}
/**
 * @param entity - object
 * @returns integer - inserted id
 */
prototype.prototype.insert = async function (...args) {

    let [debug, trx, entity] = a(args);

    entity = await this.toDb(entity);

    var query = 'INSERT INTO :table: ';

    var columns = [], marks = [], values = [];

    for (var i in entity) {

        if (entity.hasOwnProperty(i)) {

            columns.push('`' + i + '`');

            marks.push('?');

            values.push(entity[i]);
        }
    }

    query += '(' + columns.join(', ') + ') values (' + marks.join(', ') + ')';

    return this.query(debug, trx, query, values)
        .then(result => result.insertId);
}

/**
 * @param entity - object
 * @param id - mixed | object
 */
prototype.prototype.update = async function (...args) {

    let [debug, trx, entity, id] = a(args);

    entity = await this.toDb(entity);

    if ( ! id ) {

        id = false;
    }

    if (id && !isObject(id)) {

        id = {[this.__id]: id};
    }

    var query = 'UPDATE :table: SET ';

    var columns = [], values = [];

    for (let i in entity) {

        if (entity.hasOwnProperty(i)) {

            columns.push('`' + i + '` = ?');

            values.push(entity[i]);
        }
    }

    var ids = [];

    if (id) {

        for (let i in id) {

            if (id.hasOwnProperty(i)) {

                ids.push('`' + i + '` = ?');

                values.push(id[i]);
            }
        }
    }

    query += columns.join(', ');

    if (ids.length) {

        query += ' WHERE ' + ids.join(' AND ');
    }

    return this.query(debug, trx, query, values)
        .then(result => result.affectedRows);
}

prototype.prototype.delete = async function (...args) {

    let [debug, trx, id] = a(args);

    let where = ' ';

    if (Array.isArray(id)) {

        where += ':id: in (:id)';
    }
    else {

        where += ':id: = :id';
    }

    return await this.query(debug, trx, `delete from :table: where ` + where, {
        id,
    })
        .then(result => result.affectedRows)
    ;
}

prototype.prototype.destroy = function () {

    this.knex.destroy();

    return this;
}

prototype.a = a;

module.exports = prototype;