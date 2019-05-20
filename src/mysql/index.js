
const log = require('inspc');

const isObject = require('../utils/isObject');

const Opt = require('../Opt');

function a(args) {

    args = [...args];

    let trx         = false;

    for (let i = 0, l = args.length, a ; i < l ; i += 1 ) {

        a = args[i];

        if (trx === false && typeof a === 'function') {

            trx         = a;

            args.splice(i, 1);

            break;
        }
    }

    let opt         = false;

    for (let i = 0, l = args.length, a ; i < l ; i += 1 ) {

        a = args[i];

        if (opt === false && isObject(a) && a.isProxy) {

            opt         = a;

            args.splice(i, 1);

            break;
        }
    }

    if ( ! opt ) {

        for (let i = 0, l = args.length, a ; i < l ; i += 1 ) {

            a = args[i];

            if (opt === false && typeof a === 'boolean') {

                opt         = Opt(a);

                break;
            }
        }
    }

    if ( ! opt ) {

        opt = Opt(false);
    }

    args = args
        .filter(a => typeof a !== 'boolean')
        .filter(a => a !== null)
        .filter(a => a !== undefined)
    ;

    return [opt, trx, ...args];
}

function prototype(knex, table, id) {
    this.knex           = knex;
    this.__table        = table;
    this.__id           = id;
}

prototype.prototype.initial = function () {
    return {prototype:'MYSQL: prototype.initial()'};
}

prototype.prototype.fromDb = async function (row, opt, trx) {
    return row;
}
prototype.prototype.toDb = async function (row, opt, trx) {
    return row;
}

prototype.prototype.raw = async function (...args) {

    let [opt, trx, query, params] = a(args);

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

        opt.debug && log.dump({
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

            throw `Query: '${query}' error: value for parameter '${name}' is missing on the list of given parameters: ` + JSON.stringify(params);
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

    opt.debug && log.dump({
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

prototype.prototype.fetch = function (...args) {

    let [opt, trx] = a(args);

    let promise = this.query(...args);

    if ( opt.fromDb !== false && opt.both !== false ) {

        promise = promise.then(data => Promise.all(data.map(d => this.fromDb(d, opt, trx))));
    }

    return promise;
};

prototype.prototype.queryOne = function (...args) {

    let [opt, trx] = a(args);

    let promise = this.query(...args)
        .then(rows => {

            if (rows.length < 2) {

                return rows.pop(); // return first row from result - but only if there is only one
            }

            return Promise.reject('found ' + rows.length + ' rows, queryOne is designed to fetch first from only one row');
        })
    ;

    if ( opt.fromDb !== false && opt.both !== false ) {

        promise = promise.then(d => this.fromDb(d, opt, trx));
    }

    return promise;
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

    let [opt, trx, id, select = '*'] = a(args);

    if (typeof select !== 'string') {

        throw 'second argument of find method should be string';
    }

    let promise = this.queryOne(opt, trx, `SELECT ${select} FROM :table: WHERE :id: = :id`, {
        id,
    });

    if ( opt.fromDb !== false && opt.both !== false ) {

        promise.then(d => this.fromDb(d, opt, trx));
    }

    return promise;
};

prototype.prototype.findAll = function (...args) {

    let [opt, trx] = a(args);

    return this.fetch(opt, trx, `select * from :table: order by :id:`);
}
/**
 * @param entity - object
 * @returns integer - inserted id
 */
prototype.prototype.insert = async function (...args) {

    let [opt, trx, entity] = a(args);

    if ( opt.toDb !== false && opt.both !== false ) {

        entity = await this.toDb(entity, opt, trx);
    }

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

    return this.query(opt, trx, query, values)
        .then(result => result.insertId);
}

/**
 * @param entity - object
 * @param id - mixed | object
 */
prototype.prototype.update = async function (...args) {

    let [opt, trx, entity, id] = a(args);

    if ( opt.toDb !== false && opt.both !== false ) {

        entity = await this.toDb(entity, opt, trx);
    }

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

    return this.query(opt, trx, query, values)
        .then(result => result.affectedRows);
}

prototype.prototype.delete = async function (...args) {

    let [opt, trx, id] = a(args);

    let where = ' ';

    if (Array.isArray(id)) {

        where += ':id: in (:id)';
    }
    else {

        where += ':id: = :id';
    }

    return await this.query(opt, trx, `delete from :table: where ` + where, {
        id,
    })
        .then(result => result.affectedRows)
    ;
}

prototype.prototype.destroy = function () {

    this.knex.destroy();

    return this;
}

prototype.prototype.transactify = async function (...args) {

    const list = args.filter(a => typeof a === 'function');

    let logic, trx = undefined;

    if (list.length > 1) {

        trx     = list[0];

        logic   = list[1];
    }
    else {

        logic   = list[0];
    }

    if ( typeof logic !== 'function') {

        throw new Error(`transactify: logic is not a function`);
    }

    if (trx) {

        return await logic(trx);
    }

    return await this.knex.transaction(trx => logic(trx));
}

prototype.a     = a;

prototype.Opt   = Opt;

module.exports = prototype;