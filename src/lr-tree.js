
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
         *      SELECT id, parent_id pid, level le, l, r, sort s, t.title FROM tree t ORDER BY l, s
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

                        if (t.le !== level) {

                            throw th(key, t.id, 'le', level, t.le);
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

                if (typeof select === 'string') {

                    select = select.trim();

                    if (select) {

                        select = ', ' + select;
                    }
                }

                let tree = await this.query(debug, trx, `SELECT :id: id, :pid: pid, :level: le, :l: l, :r: r, :sort: s${select} FROM :table: t ORDER BY l, s`, {
                    ...opt.columns,
                });

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

                        if (t.le !== level) {

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

                    let tree = await this.query(debug, trx, `SELECT :id: id, :pid: pid, :level: le, :l: l, :r: r, :sort: s FROM :table: t ORDER BY l, s`, {
                        ...opt.columns,
                    });

                    tree = this.assemble(tree);

                    try {

                        await fix.call(this, debug, trx, tree);
                    }
                    catch (e) {

                        // valid = false;
                        //
                        // invalidMsg = e.message;

                        log.dump({
                            fixError: e.message,
                        })

                        throw e;
                    }

                    return tree;
                };

                if (trx) {

                    return await logic.call(this, trx);
                }

                return await this.knex.transaction(logic);
            }
        }()),
    }
}