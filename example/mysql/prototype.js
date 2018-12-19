
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};

function a(args, noSingle = true) {

    let debug = false;

    if (typeof args[0] === 'boolean') {

        debug = args[0];

        if (noSingle && args.length === 1) {

            throw `First argument is bool but it shouldn't be the only argument`;
        }
    }

    const trx = args.find(a => typeof a === 'function') || false;

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

prototype.prototype.fromDb = function (row) {
    return row;
}
prototype.prototype.toDb = function (row) {
    return row;
}

prototype.prototype.raw = function (...args) {

    let [debug, trx, query, params] = a(args);

    if (typeof query !== 'string') {

        throw `query '${query}' is not a string`;
    }

    if (Array.isArray(params)) {

        let i = 0;

        query = query.replace(/(?:(?::([0-9a-z_]+)(:?))|(?:\?+))/ig, (all, name, semi) => {

            if (name === undefined && semi === undefined) {

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

            if (semi && name && (name === 'id' || name === 'table')) {

                name = '__' + name;
            }
            else {

                throw `If params given as an array then you can't use other named binding then ':id:' and ':table:'`;
            }

            params.splice(i, 0, this[name]);

            i += 1;

            // log(all, i, JSON.stringify(params));

            return semi ? '??' : '?';
        });

        debug && log.dump({
            query,
            params,
        });

        return (trx || this.knex).raw(query, params).catch(e => Promise.reject(JSON.stringify({
            query,
            params,
            queryParams,
            e: (e + ''),
            stack: (e.stack + '').split("\n")
        }, null, 4)));
    }

    if ( typeof params === 'number' || typeof params === 'string') {

        params = {[this.__id]: params};
    }

    if (query.indexOf(':table:') > -1) {

        if ( params && typeof params.__table !== 'undefined' ) {

            throw `Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter 'table' manually, use different binding name like for example :_table: or remove 'table' parameter from parameters object because it will be assigne implicitly internally by library. You might use also raw knex interface 

const knex = require('roderic/libs/knex'); // or const knex = require('../webpack/knex').default;

let result = await knex().raw('select * from :table:', {
    table: 'users'
});

`;
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

            throw `Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter 'id' manually, use different binding name like for example :_id: or remove 'id' parameter from parameters object because it will be assigne implicitly by library. You might use also raw knex interface 

const knex = require('roderic/libs/knex'); // or const knex = require('../webpack/knex').default;

let result = await knex().raw('select * from users where id = :id:', {
    id: 2
});

`;
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

            throw `Query: '${query}' error: value for parameter '${name}' is missing on the list of given parameter: ` + JSON.stringify(params, null, 4);
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

    return this.knex.raw(query, queryParams).catch(e => Promise.reject({
        query,
        params,
        queryParams,
        e: (e + ''),
        stack: (e.stack + '').split("\n")
    }));
}

prototype.prototype.query = function (...args) {
    return this.raw(...args).then(result => result[0])
};

prototype.prototype.queryOne = function (...args) {
    return this.query(...args)
        .then(rows => {

            if (rows.length === 1) {

                return rows.pop();
            }

            return Promise.reject(JSON.stringify({
                message: 'queryOne error',
                error: 'found ' + rows.length + ' rows, queryOne is designed to fetch first from only one row'
            }, null, 4));
        })
            .then(this.fromDb)
        ;
}
prototype.prototype.queryColumn = function (...args) {
    return this.queryOne(...args)
        .then(rows => Object.values(rows)[0])
    ;
};

prototype.prototype.count = function (debug, trx) {

    const query = 'SELECT COUNT(*) AS c FROM :table:';

    return this.query(debug, trx, query)
        .then(function (rows) {

            if (rows.length > 0 && rows[0].c) {

                return rows[0].c;
            }

            return Promise.reject({
                message:'queryOne error',
                error:"Count(*) not work for query: '" + query + "'"
            });
        });
}

prototype.prototype.find = function (...args) {

    let [debug, trx, id, select = '*'] = a(args);

    if (typeof select !== 'string') {

        throw 'second argument of find method should be string';
    }

    return this.queryOne(debug, trx, `SELECT ${select} FROM :table: WHERE :id: = :id`, {
        id,
    })
        .catch(e => Promise.reject(JSON.stringify({
            query,
            params,
            queryParams,
            e
        }, null, 4)))
        .then(this.fromDb)
    ;
};

prototype.prototype.findAll = function (debug, trx) {
    return this.query(debug, trx, `select * from :table: order by :id:`)
        .then(data => data.map(this.fromDb))
    ;
}
/**
 * @param entity - object
 * @returns integer - inserted id
 */
prototype.prototype.insert = function (...args) {

    let [debug, trx, entity] = a(args);

    entity = this.toDb(Object.assign({}, entity));

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
        .then(result => {
            try {

                return result.insertId;
            }
            catch (e) {

                throw `prototype.js insert() error: Malformed response: ` + JSON.stringify(result, null, 4)
            }
        });
}

/**
 * @param entity - object
 * @param id - mixed | object
 */
prototype.prototype.update = function (...args) {

    let [debug, trx, entity, id] = a(args);

    entity = this.toDb(Object.assign({}, entity));

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
        .then(result => {
            try {

                return result.affectedRows;
            }
            catch (e) {

                throw `prototype.js insert() error: Malformed response: ` + JSON.stringify(result, null, 4)
            }
        });
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
        .then(result => {
            try {

                return result.affectedRows;
            }
            catch (e) {

                throw `prototype.js insert() error: Malformed response: ` + JSON.stringify(result, null, 4)
            }
        });
}

prototype.a = a;

module.exports = prototype;