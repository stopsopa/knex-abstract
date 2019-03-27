
const isObject = require('nlab/isObject');

const isArray  = require('nlab/isArray');

const log               = require('inspc');

const abstract          = require('.');

// const extend            = abstract.extend;

const prototype         = abstract.prototype;

const a                 = prototype.a;

const th = msg => new Error(`lr-tree.js: ${msg}`);


/**
 * const lrtree = require('./lr-tree');
 *
 * lrtree({
 *     columns: {
 *          l       : 'l',
 *          r       : 'r',
 *          level   : 'level',
 *          pid     : 'parent_id',
 *          sort    : 'sort',
 *     },
 *
 * })
 * @param opt
 * @returns {{}}
 */
module.exports = opt => {

    if ( ! isObject(opt) ) {

        throw th(`opt is not an object`);
    }

    if ( ! isObject(opt.columns) ) {

        throw th(`opt.columns is not an object`);
    }

    const {
        l,
        r,
        level,
        pid,
        sort,
    } = opt.columns;

    Object.keys(opt.columns).forEach(key => {

        if ( typeof opt.columns[key] !== 'string' ) {

            throw th(`opt.columns.${key} is not a string`);
        }

        key = key.trim();

        if ( ! opt.columns[key] ) {

            throw th(`opt.columns.${key} is an empty string`);
        }
    });

    return {
        treeSkeleton: async function (...args) {

            let [debug, trx, select = ''] = a(args);

            if (typeof select === 'string') {

                select = select.trim();

                if (select) {

                    select = ', ' + select;
                }
            }

            return await this.query(debug, trx, `SELECT :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: s${select} FROM :table: t ORDER BY l, s`, {
                ...opt.columns,
            });
        },
        treeFindOne: async function (...args) {

            let [debug, trx, id] = a(args);

            return await this.queryOne(debug, trx, `SELECT :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: s FROM :table: t WHERE :id: = :id`, {
                ...opt.columns,
                id,
            });
        },
        assemble: list => {

            if ( ! isArray(list) ) {

                throw th(`assemble: list is not array`);
            }

            const obj = list.reduce((acc, row) => {

                acc[row.id] = row;

                return acc;
            }, {});

            for (let i = 0, l = list.length ; i < l ; i += 1 ) {

                if (list[i].pid && obj[list[i].pid]) {

                    if ( ! isArray(obj[list[i].pid].children) ) {

                        obj[list[i].pid].children = [];
                    }

                    obj[list[i].pid].children.push(list[i]);
                }
            }

            return list.filter(l => !l.pid);
        },
        /**
         * For manual inspection in DB:
         *      SELECT id, parent_id pid, level level, l, r, sort s, t.title FROM tree t ORDER BY l, s
         */
        treeCheckIntegrity: (function () {

            function th(p, nodeId, side, expectedIndex, found) {

                return new Error(`LRTree integrity error: Node id: '${nodeId}' key: '${side}' should have value '${expectedIndex}', found '${found}', path to node '${p}'`)
            }

            function check(list, k = 1, p = '', pid = false, level = 1) {

                if (Array.isArray(list)) {

                    for (let i = 0, l = list.length, t, key; i < l ; i += 1 ) {

                        t = list[i];

                        key = p ? `${p}.${t.id}` : t.id;

                        if (t.l !== k) {

                            throw th(key, t.id, 'l', k, t.l);
                        }

                        k += 1;

                        if (Array.isArray(t.children)) {

                            k = check(t.children, k, key, t.id, level + 1);
                        }

                        if (t.r !== k) {

                            throw th(key, t.id, 'r', k, t.r);
                        }

                        if (pid && t.pid !== pid) {

                            throw th(key, t.id, 'pid', pid, t.pid);
                        }

                        if (t.level !== level) {

                            throw th(key, t.id, 'level', level, t.level);
                        }

                        if (t.s !== i + 1) {

                            throw th(key, t.id, 's', i + 1, t.s);
                        }

                        k += 1;
                    }
                }

                return k;
            }

            return async function (...args) {

                let [debug, trx, select = ''] = a(args);

                let tree = await this.treeSkeleton(debug, trx, select);

                tree = this.assemble(tree);

                let valid = true;

                let invalidMsg;

                try {

                    check(tree);
                }
                catch (e) {

                    valid = false;

                    invalidMsg = e.message;

                    log.dump({
                        checkError: e.message,
                    })
                }

                return {
                    tree,
                    valid,
                    invalidMsg,
                };
            };
        }()),
        treeFix: (function () {

            async function fix(debug, trx, tree, k = 1, p = '', pid = false, level = 1) {

                if (Array.isArray(tree)) {

                    for (let i = 0, l = tree.length, t, key; i < l ; i += 1 ) {

                        const toFix = {};

                        t = tree[i];

                        key = p ? `${p}.${t.id}` : t.id;

                        if (t.l !== k) {

                            toFix[opt.columns.l] = k;
                        }

                        k += 1;

                        if (Array.isArray(t.children)) {

                            k = await fix.call(this, debug, trx, t.children, k, key, t.id, level + 1);
                        }

                        if (t.r !== k) {

                            toFix[opt.columns.r] = k;
                        }

                        if (pid && t.pid !== pid) {

                            toFix[opt.columns.pid] = pid;
                        }

                        if (t.level !== level) {

                            toFix[opt.columns.level] = level;
                        }

                        if (t.s !== i + 1) {

                            toFix[opt.columns.sort] = i + 1;
                        }

                        if (Object.keys(toFix).length) {

                            await this.update(debug, trx, toFix, t.id);
                        }

                        k += 1;
                    }
                }

                return k;
            }

            return async function (...args) {

                let [debug, trx] = a(args);

                const logic = async trx => {

                    let tree = await this.treeSkeleton(...args);

                    tree = this.assemble(tree);

                    await fix.call(this, debug, trx, tree);

                    return tree;
                };

                if (trx) {

                    return await logic.call(this, trx);
                }

                return await this.knex.transaction(logic);
            }
        }()),
        treeDelete: async function (...args) {

            let [debug, trx, id] = a(args);

            const logic = async trx => {

                const found = await this.treeFindOne(debug, trx, id);

                if (typeof found.l !== 'number') {

                    throw th(`treeDelete: found.l is not a number`);
                }

                if ( found.l < 1 ) {

                    throw th(`treeDelete: found.l is smaller than 1`);
                }

                if (typeof found.r !== 'number') {

                    throw th(`treeDelete: found.r is not a number`);
                }

                if ( found.r < 1 ) {

                    throw th(`treeDelete: found.r is smaller than 1`);
                }

                if ( found.l >= found.r ) {

                    throw th(`treeDelete: found.l is >= than found.r`);
                }

                const howManyToRemove = (found.r - found.l + 1) / 2;

                if ( ! Number.isInteger(howManyToRemove) ) {

                    throw th(`treeDelete: howManyToRemove is not integer, found.l: ${found.l}, found.r: ${found.r}, howManyToRemove: ` + JSON.stringify(howManyToRemove));
                }

                const result = await this.query(debug, trx, `delete from :table: where :lcol: >= :l and :rcol: <= :r`, {
                    lcol    : opt.columns.l,
                    rcol    : opt.columns.r,
                    l       : found.l,
                    r       : found.r,
                });

                if ( result.affectedRows !== howManyToRemove ) {

                    throw th(`treeDelete: howManyToRemove is prognosed to: '${howManyToRemove}' but after remove result.affectedRows is: '${result.affectedRows}'`);
                }

                const parent = await this.treeFindOne(debug, trx, found.pid);

                await this.query(debug, trx, `update :table: set :lcol: = :lcol: - :x where :lcol: > :l`, {
                    lcol    : opt.columns.l,
                    x       : howManyToRemove * 2,
                    l       : found.l,
                });

                await this.query(debug, trx, `update :table: set :rcol: = :rcol: - :x where :rcol: > :r`, {
                    rcol    : opt.columns.r,
                    x       : howManyToRemove * 2,
                    r       : found.r,
                });

                /**
                 * https://github.com/mysqljs/mysql/issues/1751#issue-234563643
                 * Require config like:
                 *
                 connection: {
                        host        : process.env.PROTECTED_MYSQL_HOST,
                        port        : process.env.PROTECTED_MYSQL_PORT,
                        user        : process.env.PROTECTED_MYSQL_USER,
                        password    : process.env.PROTECTED_MYSQL_PASS,
                        database    : process.env.PROTECTED_MYSQL_DB,
                        multipleStatements: true,
                    },
                 */
                await this.query(debug, trx, `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id`, {
                    sort    : opt.columns.sort,
                    pid     : opt.columns.pid,
                    id      : parent.id
                });
            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        },
        treeCreate: async function (...args) {

            let [debug, trx, id] = a(args);

            const logic = async trx => {

                const found = await this.treeFindOne(debug, trx, id);

                if (typeof found.l !== null) {

                    throw th(`treeCreate: found.l is not null, should be null`);
                }

                if (typeof found.r !== null) {

                    throw th(`treeCreate: found.r is not null, should be null`);
                }

                if (typeof found.level !== null) {

                    throw th(`treeCreate: found.level is not null, should be null`);
                }

                if (typeof found.pid !== null) {

                    throw th(`treeCreate: found.pid is not null, should be null`);
                }

                if (typeof found.sort !== null) {

                    throw th(`treeCreate: found.sort is not null, should be null`);
                }




                const howManyToRemove = (found.r - found.l + 1) / 2;

                if ( ! Number.isInteger(howManyToRemove) ) {

                    throw th(`treeCreate: howManyToRemove is not integer, found.l: ${found.l}, found.r: ${found.r}, howManyToRemove: ` + JSON.stringify(howManyToRemove));
                }

                const result = await this.query(debug, trx, `delete from :table: where :lcol: >= :l and :rcol: <= :r`, {
                    lcol    : opt.columns.l,
                    rcol    : opt.columns.r,
                    l       : found.l,
                    r       : found.r,
                });

                if ( result.affectedRows !== howManyToRemove ) {

                    throw th(`treeCreate: howManyToRemove is prognosed to: '${howManyToRemove}' but after remove result.affectedRows is: '${result.affectedRows}'`);
                }

                const parent = await this.treeFindOne(debug, trx, found.pid);

                await this.query(debug, trx, `update :table: set :lcol: = :lcol: - :x where :lcol: > :l`, {
                    lcol    : opt.columns.l,
                    x       : howManyToRemove * 2,
                    l       : found.l,
                });

                await this.query(debug, trx, `update :table: set :rcol: = :rcol: - :x where :rcol: > :r`, {
                    rcol    : opt.columns.r,
                    x       : howManyToRemove * 2,
                    r       : found.r,
                });

                /**
                 * https://github.com/mysqljs/mysql/issues/1751#issue-234563643
                 * Require config like:
                 *
                 connection: {
                        host        : process.env.PROTECTED_MYSQL_HOST,
                        port        : process.env.PROTECTED_MYSQL_PORT,
                        user        : process.env.PROTECTED_MYSQL_USER,
                        password    : process.env.PROTECTED_MYSQL_PASS,
                        database    : process.env.PROTECTED_MYSQL_DB,
                        multipleStatements: true,
                    },
                 */
                await this.query(debug, trx, `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id`, {
                    sort    : opt.columns.sort,
                    pid     : opt.columns.pid,
                    id      : parent.id
                });
            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        }
    }
}