
const log           = require('inspc');

const isObject          = require('nlab/isObject');

const promiseall        = require('nlab/promiseall');

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
        // .filter(a => a !== null)
        .filter(a => a !== undefined)
    ;

    return [opt, trx, ...args];
}

function prototype(knex, table, id) {
    this.knex           = knex;
    this.__table        = table;
    this.__id           = id;
}

prototype.prototype.th = function (msg) {
    return new Error(`${this.__table}.js error: ${msg}`);
};

prototype.prototype.initial = function () {
    return {prototype:'MYSQL: prototype.initial()'};
}

prototype.prototype.fromDb = function (row, opt, trx) {
    return row;
}
prototype.prototype.toDb = function (row, opt, trx) {
    return row;
}

prototype.prototype.raw = async function (...args) {

    let [opt, trx, query, params] = a(args);

    const deep = ( (Number.isInteger(opt.debug) && opt.debug > 1) ? opt.debug : undefined);

    if (typeof query !== 'string') {

        throw this.th(`query '${query}' is not a string`);
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

                throw this.th(`If params given as an array then you can't use other named binding then ':id:' and ':table:'`);
            }

            params.splice(i, 0, this[name]);

            i += 1;

            // log(all, i, JSON.stringify(params));

            return '??';
        });

        opt.debug && log.dump({
            query,
            params,
        }, deep);

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

            throw this.th(`Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter '__table' manually`);
        }

        if ( ! isObject(params) ) {

            params = {};
        }

        if ( ! this.__table ) {

            throw this.th(`this.__table not specified`)
        }

        params.__table = this.__table;
    }

    if (query.indexOf(':id:') > -1) {

        if ( params && typeof params.__id !== 'undefined' ) {

            throw this.th(`Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter '__id' manually`);
        }

        if ( ! isObject(params) ) {

            params = {};
        }

        if ( ! this.__id ) {

            throw this.th(`this.__id not specified`)
        }

        params.__id = this.__id;
    }

    let queryParams = [];

    query = query.replace(/:([0-9a-z_]+)(:?)/ig, (all, name, semi) => {

        if (semi && name && (name === 'id' || name === 'table')) {

            name = '__' + name;
        }

        if ( typeof params[name] === 'undefined') {

            throw this.th(`Query: '${query}' error: value for parameter '${name}' is missing on the list of given parameters: ` + JSON.stringify(params));
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
    }, deep);

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

        return promise.then(data => promiseall(data.map(d => this.fromDb(d, opt, trx))));
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

        return promise.then(d => this.fromDb(d, opt, trx));
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

    let [opt, trx, ...rest] = a(args);

    return this.queryColumn({
        ...opt,
        fromDb: false,
    }, trx, 'SELECT COUNT(*) AS c FROM :table:', ...rest);
}

prototype.prototype.find = function (...args) {

    let [opt, trx, id, select = '*'] = a(args);

    if (typeof select !== 'string') {

        throw this.th('second argument of find method should be string');
    }

    let promise = this.queryOne(opt, trx, `SELECT ${select} FROM :table: WHERE :id: = :id`, {
        id,
    });

    if ( opt.fromDb !== false && opt.both !== false ) {

        return promise.then(d => this.fromDb(d, opt, trx));
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
        .then(result => result.insertId)
    ;
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
        .then(result => result.affectedRows)
    ;
}

prototype.prototype.delete = function (...args) {

    let [opt, trx, id] = a(args);

    let where = ' ';

    if (Array.isArray(id)) {

        where += ':id: in (:id)';
    }
    else {

        where += ':id: = :id';
    }

    return this.query(opt, trx, `delete from :table: where ` + where, {
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

        throw this.th(`transactify: logic is not a function`);
    }

    if (trx) {

        return await logic(trx);
    }

    return await this.knex.transaction(trx => logic(trx));
}

prototype.prototype.fetchColumnsFiltered = async function (...args) {

    let [debug, trx, opt = {}] = a(args);

    let {
        filter = 'def',
        format = false,
    } = opt || {};

    let list = await this.query(debug, trx, `SHOW COLUMNS FROM :table:`);

    if ( typeof format !== 'string' ) {

        throw this.th(`format is not a string`);
    }

    if ( ! isObject(this.filters) ) {

        throw this.th(`! isObject(${this.__table}.js.filters)`);
    }

    if ( ! Array.isArray(this.filters.def) ) {

        throw this.th(`! Array.isArray(man.js.filters.def)`);
    }

    if ( typeof filter !== 'string' ) {

        throw this.th(`filter is not a string`);
    }

    if ( ! Array.isArray(this.filters[filter]) ) {

        throw this.th(`there is no '${filter}' filter`);
    }

    const exclude = this.filters[filter];

    list = list.filter(r => !exclude.includes(r.Field));

    switch (format) {
        case 'object':
            return list.reduce((acc, {Field, ...rest}) => {
                acc[Field] = rest;
                return acc;
            }, {});
        case 'list':
            return list.map(r => r.Field);
        default:
            return list;
    }
},

  prototype.a     = a;

prototype.Opt   = Opt;

module.exports = prototype;