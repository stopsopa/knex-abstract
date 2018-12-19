
function isObject(a) {
    return (!!a) && (a.constructor === Object);
};
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

function values(object) {
    if (isArray(object)) {
        return object;
    }
    var list = [];
    if (object) {
        for (var i in object) {
            list.push(object[i]);
        }
    }
    return list;
};

function prototype(knex, table, id) {
    this.knex           = knex;
    this.table          = table;
    this.id             = id;
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

prototype.prototype.query = function (query) {

    var params = (arguments.length > 0) ? arguments[1] : false;

    if (params) {

        if (!isArray(params) && !isObject(params)) {

            params = {[this.id]: params};
        }
    }

    var queryParams = values(params);

    if (query.indexOf(':table:') > -1) {

        query = query.replace(/:table:/g, '`' + this.table + '`');
    }

    if (query.indexOf(':id:') > -1) {

        query = query.replace(/:id:/g, '`' + this.id + '`');
    }

    if (isObject(params) && queryParams.length && query.indexOf(':') > -1) {

        var queryParams = [];

        query = query.replace(/:([a-z0-9]+)/ig, function (all, match) {

            if (typeof params[match] === 'undefined') {
                throw "Param '" + match + "' not found in object: " + JSON.stringify(params)
                + ' for request: '+ query;
            }

            if (isArray(params[match])) {

                queryParams = queryParams.concat(params[match]);

                return '?,'.repeat(params[match].length - 1) + '?';
            }

            queryParams.push(params[match]);

            return '?';
        });

    }

    return this.knex.raw(query, queryParams);
}


/**
 db.cache.count({
        url: 'http://urlchanged updated'
    }).then(function (count) {
        log('count: ', count)
    })
 */
prototype.prototype.count = function () {

    var params = (arguments.length > -1) ? arguments[0] : false;

    var query = 'SELECT COUNT(*) AS c FROM :table:';

    if (params) {

        var columns = [];

        for (var i in params) {
            columns.push('`' + i + '` = ?');
        }

        query += ' WHERE ' + columns.join(' AND ');
    }

    return this.query(query, values(params))
        .then(data => data[0])
        .then(function (rows) {

            if (rows.length > 0 && rows[0].c) {

                return rows[0].c;
            }

            throw "Count(*) not work for query: '" + query + "'";
        }, function (a) {
            return a
        });
}

prototype.prototype.find = function (id) {

    const   args = Array.prototype.slice.call(arguments);
    let     select = args[1];

    if (args.length > 1) {
        if (typeof select !== 'string') {
            throw 'second argument of find method should be string';
        }
    }
    else {
        select = '*';
    }

    var query = 'SELECT ' + select + ' FROM :table: WHERE `' + this.id + '` = :id';

    return new Promise((resolve, reject) => {
        this.query(query, {
            [this.id] : id
        })
            .then(data => data[0])
            .then(function (rows) {

            if (rows.length === 1) {
                return resolve(rows[0]);
            }

            reject({message:'find query error', error:'found ' + rows.length + ' rows'})
        }, function (a) {
            return a
        });
    }).then(this.fromDb);
};

prototype.prototype.findAll = function () {
    return this.query(`select * from :table: t order by t.\`${this.id}\``)
        .then(data => data[0])
        .then(data => data.map(this.fromDb))
    ;
}

/**
 * @param entity - object
 */
prototype.prototype.insert = function (entity) {

    entity = this.toDb(Object.assign({}, entity));

    var query = 'INSERT INTO :table: ';

    var columns = [], marks = [];

    for (var i in entity) {
        if (entity.hasOwnProperty(i)) {
            columns.push('`' + i + '`');
            marks.push('?');
        }
    }

    query += '(' + columns.join(', ') + ') values (' + marks.join(', ') + ')';

    return this.query(query, entity).then(data => data[0]);
}

/**
 * @param entity - object
 * @param id - mixed | object
 */
prototype.prototype.update = function (entity, id) {

    entity = this.toDb(Object.assign({}, entity));

    if (!id) {
        id = false;
    }

    if (id && !isObject(id)) {
        id = {[this.id]: id};
    }

    var query = 'UPDATE :table: SET ';

    var columns = [];

    for (var i in entity) {
        columns.push('`' + i + '` = ?');
    }

    var ids = [];

    if (id) {
        for (var i in id) {
            ids.push('`' + i + '` = ?')
        }
    }

    query += columns.join(', ') + ' WHERE ' + ids.join(' AND ');

    return this.query(query, values(entity).concat(values(id))).then(data => data[0]);
}

prototype.prototype.delete = async function (id) {

    let where = ' ';

    if (Array.isArray(id)) {

        where += ':id: in (:id)';
    }
    else {

        where += ':id: = :id';
    }

    return await this.query(`delete from :table: where ` + where, {
        id: id,
    });
}

module.exports = prototype;