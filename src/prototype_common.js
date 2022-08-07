const log = require('inspc');

const isObject = require('nlab/isObject');

const promiseall = require('nlab/promiseall');

function prototype(knex, table, id) {
  this.knex = knex;
  this.__table = table;
  this.__id = id;

  this.escaper = '`';
  if (knex.provider === 'postgresql') {
    this.escaper = '"';
  }
}

prototype.prototype.Error = function (msg) {
  return new Error(`${this.__table || 'index'}.js error: ${msg}`);
};

prototype.prototype.initial = function (opt) {
  return {prototype: 'MYSQL: prototype.initial()'};
};

prototype.prototype.fromDb = function (opt, rows) {
  return rows;
};
prototype.prototype.toDb = function (opt, row) {
  return row;
};

prototype.prototype.raw = async function (opt = {}, query, params) {
  if (typeof query !== 'string') {
    throw this.Error(`query '${query}' is not a string`);
  }

  const instance = opt.trx || this.knex;

  if (Array.isArray(params)) {
    let i = 0;

    query = query.replace(/(?:(?::([0-9a-z_]+)(:?))|(?:\?+))/gi, (all, name) => {
      if (name === undefined) {
        if (Array.isArray(params[i])) {
          const tmp = params[i];

          params.splice(i, 1);

          params.splice(i, 0, ...tmp);

          i += tmp.length;

          // log(all, i, JSON.stringify(params));

          return tmp.map((_) => all).join(',');
        }

        i += 1;

        // log(all, i, JSON.stringify(params));

        return all;
      }

      if (name && (name === 'id' || name === 'table')) {
        name = '__' + name;
      } else {
        throw this.Error(
          `If params given as an array then you can't use other named binding then ':id:' and ':table:'`
        );
      }

      params.splice(i, 0, this[name]);

      i += 1;

      // log(all, i, JSON.stringify(params));

      return '??';
    });

    opt.debug &&
      console.log({
        query,
        params,
      });

    return instance.raw(query, params).catch((e) => {
      const error = {
        query,
        params,
        e: e + '',
        stack: (e.stack + '').split('\n'),
      };

      error.toString = function () {
        return JSON.stringify(this, null, 4);
      };

      return Promise.reject(error);
    });
  }

  if (query.indexOf(':table:') > -1) {
    if (params && typeof params.__table !== 'undefined') {
      throw this.Error(
        `Binding name ':table:' is reserved, if you are using it then you shouldn't specify parameter '__table' manually`
      );
    }

    if (!isObject(params)) {
      params = {};
    }

    if (!this.__table) {
      throw this.Error(`this.__table not specified`);
    }

    params.__table = this.__table;
  }

  if (query.indexOf(':id:') > -1) {
    if (params && typeof params.__id !== 'undefined') {
      throw this.Error(
        `Binding name ':id:' is reserved, if you are using it then you shouldn't specify parameter '__id' manually`
      );
    }

    if (!isObject(params)) {
      params = {};
    }

    if (!this.__id) {
      throw this.Error(`this.__id not specified`);
    }

    params.__id = this.__id;
  }

  let queryParams = [];

  query = query.replace(/:([0-9a-z_]+)(:?)/gi, (all, name, semi) => {
    if (semi && name && (name === 'id' || name === 'table')) {
      name = '__' + name;
    }

    if (typeof params[name] === 'undefined') {
      throw this.Error(
        `Query: '${query}' error: value for parameter '${name}' is missing on the list of given parameters: ` +
          JSON.stringify(params)
      );
    }

    const placeholder = semi ? '??' : '?';

    if (Array.isArray(params[name])) {
      queryParams = [...queryParams, ...params[name]];

      return params[name].map((_) => placeholder).join(',');
    } else {
      queryParams.push(params[name]);

      return placeholder;
    }
  });

  opt.debug &&
    console.log({
      query,
      params,
      queryParams,
    });

  return instance.raw(query, queryParams).catch((e) => {
    const error = {
      query,
      params,
      queryParams,
      e: e + '',
      stack: (e.stack + '').split('\n'),
    };

    error.toString = function () {
      return JSON.stringify(this, null, 4);
    };

    return Promise.reject(error);
  });
};

prototype.prototype.query = function (opt, ...args) {
  if (!isObject(opt)) {
    throw this.Error(`knex.query() error: opt is not an object`);
  }

  return this.raw(opt, ...args).then((result) => {
    if (this.knex.provider === 'postgresql') {
      return result.rows;
    } else {
      return result[0];
    }
  });
};

prototype.prototype.fetch = function (opt, ...args) {
  if (!isObject(opt)) {
    throw this.Error(`knex.fetch() error: opt is not an object`);
  }

  let promise = this.query(opt, ...args);

  if (opt.fromDb !== false && opt.both !== false) {
    return promise
      .then((rows) => {
        if (Array.isArray(rows)) {
          return (() => {
            try {
              return Promise.resolve(this.fromDb(opt, rows));
            } catch (e) {
              return Promise.reject(e);
            }
          })();
        }

        return rows;
      })
      .then((rows) => {
        if (!Array.isArray(rows)) {
          throw this.Error(`fetch: rows is not an array`);
        }

        return rows;
      });
  }

  return promise;
};

prototype.prototype.queryOne = function (opt, ...args) {
  let promise = this.query(opt, ...args).then((rows) => {
    if (rows.length < 2) {
      return rows[0]; // return first row from result - but only if there is only one
    }

    return Promise.reject('found ' + rows.length + ' rows, queryOne is designed to fetch first from only one row');
  });

  if (opt.fromDb !== false && opt.both !== false) {
    return promise
      .then((row) => {
        if (typeof row !== 'undefined') {
          return (() => {
            try {
              return Promise.resolve(this.fromDb(opt, [row]));
            } catch (e) {
              return Promise.reject(e);
            }
          })();
        }

        return [row];
      })
      .then((rows) => {
        if (!Array.isArray(rows)) {
          throw this.Error(`queryOne error: rows is not an array`);
        }

        return rows[0];
      });
  }

  return promise;
};

prototype.prototype.queryColumn = function (opt, ...args) {
  return this.queryOne(opt, ...args).then((row) => {
    if (isObject(row)) {
      return Object.values(row)[0]; // extract value from first column
    }
  });
};

prototype.prototype.count = function (opt, ...args) {
  return this.queryColumn(opt, 'SELECT COUNT(*) AS c FROM :table:', ...args).then((c) => parseInt(c, 10));
};

prototype.prototype.find = function (opt, id, select = '*') {
  if (typeof select !== 'string') {
    throw this.Error('second argument of find method should be string');
  }

  let promise = this.queryOne(opt, `SELECT ${select} FROM :table: WHERE :id: = :id`, {id: id});

  if (opt.fromDb !== false && opt.both !== false) {
    return promise
      .then((row) => {
        if (typeof row !== 'undefined') {
          return (() => {
            try {
              return Promise.resolve(this.fromDb(opt, [row]));
            } catch (e) {
              return Promise.reject(e);
            }
          })();
        }

        return [row];
      })
      .then((rows) => {
        if (!Array.isArray(rows)) {
          throw this.Error(`find error: rows is not an array`);
        }

        return rows[0];
      });
  }

  return promise;
};

prototype.prototype.findAll = function (opt, ...args) {
  return this.fetch(opt, `select * from :table: order by :id:`, ...args);
};
/**
 * @param entity - object
 * @returns integer - inserted id
 */
prototype.prototype.insert = async function (opt, entity = {}) {
  if (opt.toDb !== false && opt.both !== false) {
    entity = await this.toDb(opt, entity);
  }

  var query = 'INSERT INTO :table: ';

  var columns = [],
    marks = [],
    values = [];

  for (var i in entity) {
    if (entity.hasOwnProperty(i)) {
      columns.push(this.escaper + i + this.escaper);

      marks.push('?');

      values.push(entity[i]);
    }
  }

  query += '(' + columns.join(', ') + ') values (' + marks.join(', ') + ')';

  // POSTGRES ONLY!!
  if (this.knex.provider === 'postgresql') {
    query += ' RETURNING :id:';
  }

  return this.query(opt, query, values).then((result) => {
    if (this.knex.provider === 'postgresql') {
      /**
       * Check later
       * not sure if result will be an array
       */

      return result[0].id;
    } else {
      return result.insertId;
    }
  });
};

/**
 * @param entity - object
 * @param id - mixed | object
 */
prototype.prototype.update = async function (opt, entity = {}, id, ...args) {
  if (opt.toDb !== false && opt.both !== false) {
    entity = await this.toDb(opt, entity);
  }

  if (!id) {
    id = false;
  }

  if (id && !isObject(id)) {
    id = {[this.__id]: id};
  }

  var query = 'UPDATE :table: SET ';

  var columns = [],
    values = [];

  for (let i in entity) {
    if (entity.hasOwnProperty(i)) {
      columns.push(this.escaper + i + this.escaper + ' = ?');

      values.push(entity[i]);
    }
  }

  var ids = [];

  if (id) {
    for (let i in id) {
      if (id.hasOwnProperty(i)) {
        ids.push(this.escaper + i + this.escaper + ' = ?');

        values.push(id[i]);
      }
    }
  }

  query += columns.join(', ');

  if (ids.length) {
    query += ' WHERE ' + ids.join(' AND ');
  }

  // POSTGRES ONLY!!
  if (this.knex.provider === 'postgresql') {
    query += ' RETURNING :id:';
  }

  return this.query(opt, query, values).then((result) => {
    if (this.knex.provider === 'postgresql') {
      return result.length;
    } else {
      return result.affectedRows;
    }
  });
};

prototype.prototype.delete = function (opt, id, ...args) {
  let where = ' ';

  if (Array.isArray(id)) {
    where += ':id: in (:id)';
  } else {
    where += ':id: = :id';
  }

  let query = `delete from :table: where ` + where;

  // POSTGRES ONLY!!
  if (this.knex.provider === 'postgresql') {
    query += ' RETURNING :id:';
  }

  return this.query(opt, query, {
    id,
  }).then((result) => {
    if (this.knex.provider === 'postgresql') {
      return result.length;
    } else {
      return result.affectedRows;
    }
  });
};

prototype.prototype.destroy = function () {
  this.knex.destroy();

  return this;
};

prototype.prototype.transactify = async function (...args) {
  const list = args.filter((a) => typeof a === 'function');

  let logic,
    trx = undefined;

  if (list.length > 1) {
    trx = list[0];

    logic = list[1];
  } else {
    logic = list[0];
  }

  if (typeof logic !== 'function') {
    throw this.Error(`transactify: logic is not a function`);
  }

  if (trx) {
    return await logic(trx);
  }

  return await this.knex.transaction((trx) => logic(trx));
};

prototype.prototype.fetchColumnsFiltered = async function (...args) {
  let [debug, trx, opt = {}] = a(args);

  let {filter = 'def', format = false} = opt || {};

  let list = await this.query(debug, trx, `SHOW COLUMNS FROM :table:`);

  if (typeof format !== 'string') {
    throw this.th(`format is not a string`);
  }

  if (!isObject(this.filters)) {
    throw this.th(`! isObject(${this.__table}.js.filters)`);
  }

  if (!Array.isArray(this.filters.def)) {
    throw this.th(`! Array.isArray(man.js.filters.def)`);
  }

  if (typeof filter !== 'string') {
    throw this.th(`filter is not a string`);
  }

  if (!Array.isArray(this.filters[filter])) {
    throw this.th(`there is no '${filter}' filter`);
  }

  const exclude = this.filters[filter];

  list = list.filter((r) => !exclude.includes(r.Field));

  switch (format) {
    case 'object':
      return list.reduce((acc, {Field, ...rest}) => {
        acc[Field] = rest;
        return acc;
      }, {});
    case 'list':
      return list.map((r) => r.Field);
    default:
      return list;
  }
};

module.exports = prototype;
