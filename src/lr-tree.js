
const isObject = require('nlab/isObject');

const isArray  = require('nlab/isArray');

const log               = require('inspc');

const abstract          = require('.');

// const extend            = abstract.extend;

const prototype         = abstract.prototype;

const a                 = prototype.a;

const th = msg => new Error(`lr-tree.js: ${msg}`);

const toString = data => {

    log.start();

    log.dump(data);

    return log.get(false);
}


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
module.exports = topt => {

    if ( ! isObject(topt) ) {

        throw th(`topt is not an object`);
    }

    if ( ! isObject(topt.columns) ) {

        throw th(`topt.columns is not an object`);
    }

    const {
        l,
        r,
        level,
        pid,
        sort,
    } = topt.columns;

    Object.keys(topt.columns).forEach(key => {

        if ( typeof topt.columns[key] !== 'string' ) {

            throw th(`topt.columns.${key} is not a string`);
        }

        key = key.trim();

        if ( ! topt.columns[key] ) {

            throw th(`topt.columns.${key} is an empty string`);
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

            return await this.query(debug, trx, `SELECT :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort${select} FROM :table: t ORDER BY l, sort`, {
                ...topt.columns,
            });
        },
        treeFindOne: async function (...args) {

            let [debug, trx, id] = a(args);

            return await this.queryOne(debug, trx, `SELECT :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort FROM :table: t WHERE :id: = :id`, {
                ...topt.columns,
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

                            throw th(key, t.id, l, k, t.l);
                        }

                        k += 1;

                        if (Array.isArray(t.children)) {

                            k = check(t.children, k, key, t.id, level + 1);
                        }

                        if (t.r !== k) {

                            throw th(key, t.id, r, k, t.r);
                        }

                        if (pid && t.pid !== pid) {

                            throw th(key, t.id, pid, pid, t.pid);
                        }

                        if (t.level !== level) {

                            throw th(key, t.id, level, level, t.level);
                        }

                        if (t.sort !== i + 1) {

                            throw th(key, t.id, sort, i + 1, t.sort);
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

            async function fix(debug, trx, tree, k = 1, p = '', _pid = false, lvl = 1) {

                if (Array.isArray(tree)) {

                    for (let i = 0, ll = tree.length, t, key; i < ll ; i += 1 ) {

                        const toFix = {};

                        t = tree[i];

                        key = p ? `${p}.${t.id}` : t.id;

                        if (t.l !== k) {

                            toFix[l] = k;
                        }

                        k += 1;

                        if (Array.isArray(t.children)) {

                            k = await fix.call(this, debug, trx, t.children, k, key, t.id, lvl + 1);
                        }

                        if (t.r !== k) {

                            toFix[r] = k;
                        }

                        if (_pid && t.pid !== _pid) {

                            toFix[pid] = _pid;
                        }

                        if (t.level !== lvl) {

                            toFix[level] = lvl;
                        }

                        if (t.sort !== i + 1) {

                            toFix[sort] = i + 1;
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

            let flip    = false;

            if (isObject(id)) {

                if (id.flip) {

                    flip = true;
                }

                id = id.id;
            }

            const logic = async trx => {

                let found;

                if ( isObject(id) ) {

                    found = id;
                }
                else {

                    if ( id === undefined) {

                        throw th(`treeDelete: id can't be undefined`);
                    }

                    found = await this.treeFindOne(debug, trx, id);
                }

                if ( ! found ) {

                    throw th(`treeDelete: found not found by id: ${id}`);
                }

                if ( found.level === 1 ) {

                    throw th(`Can't use method treeDelete() with root element of the tree`);
                }

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

                const parent = await this.treeFindOne(debug, trx, found.pid);

                const howManyToRemove = (found.r - found.l + 1) / 2;

                if ( ! Number.isInteger(howManyToRemove) ) {

                    throw th(`treeDelete: howManyToRemove is not integer, found.l: ${found.l}, found.r: ${found.r}, howManyToRemove: ` + JSON.stringify(howManyToRemove));
                }

                let result;

                if (flip) {

                    result = await this.query(debug, trx, `update :table: set :sort: = -:sort: where :l: >= :vl and :r: <= :vr`, {
                        sort,
                        l,
                        r,
                        vl  : found.l,
                        vr  : found.r,
                    });
                }
                else {

                    result = await this.query(debug, trx, `delete from :table: where :l: >= :vl and :r: <= :vr`, {
                        l,
                        r,
                        vl  : found.l,
                        vr  : found.r,
                    });
                }

                if ( result.affectedRows !== howManyToRemove ) {

                    throw th(`treeDelete: howManyToRemove is prognosed to: '${howManyToRemove}' but after remove result.affectedRows is: '${result.affectedRows}'`);
                }

                await this.query(debug, trx, `update :table: set :l: = :l: - :offset where :l: > :vl and :sort: > 0`, {
                    l,
                    sort,
                    offset  : howManyToRemove * 2,
                    vl      : found.l,
                });

                await this.query(debug, trx, `update :table: set :r: = :r: - :offset where :r: > :vr and :sort: > 0`, {
                    r,
                    sort,
                    offset  : howManyToRemove * 2,
                    vr      : found.r,
                });

                /**
                 * https://github.com/mysqljs/mysql/issues/1751#issue-234563643
                 * Require config like:
                 *
                    connection: {
                        host                : process.env.PROTECTED_MYSQL_HOST,
                        port                : process.env.PROTECTED_MYSQL_PORT,
                        user                : process.env.PROTECTED_MYSQL_USER,
                        password            : process.env.PROTECTED_MYSQL_PASS,
                        database            : process.env.PROTECTED_MYSQL_DB,
                        multipleStatements  : true,
                    },
                 */

                let excludeFlipped = '';

                if (flip) {

                    excludeFlipped = ` AND :sort: > 0`;
                }

                // return;
                await this.query(debug, trx, `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id${excludeFlipped} ORDER BY :l:`, {
                    sort,
                    pid,
                    id      : parent.id,
                    l
                });
            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        },
        treeCreateBefore: async function (...args) {

            let [debug, trx, opt = {}] = a(args);

            const {sourceId, targetId} = opt;

            const logic = async trx => {

                if ( targetId === undefined) {

                    throw th(`treeCreateAfter: targetId can't be undefined`);
                }

                const target = await this.treeFindOne(debug, trx, targetId);

                if ( ! target ) {

                    throw th(`treeCreateAfter: target not found by id: ${targetId}`);
                }

                if ( sourceId === undefined) {

                    throw th(`treeCreateAfter: sourceId can't be undefined`);
                }

                const source = await this.treeFindOne(debug, trx, sourceId);

                if ( ! source ) {

                    throw th(`treeCreateAfter: source not found by id: ${sourceId}`);
                }

                if ( target.pid === undefined) {

                    throw th(`treeCreateAfter: target.pid can't be undefined`);
                }

                const parent = await this.treeFindOne(debug, trx, target.pid);

                if ( ! parent ) {

                    throw th(`treeCreateAfter: parent not found by id: ${target.pid}`);
                }

                if ( parent.level === 1 ) {

                    throw th(`Can't use method treeCreateAfter() with root element of the tree`);
                }

                const params = {
                    sourceId    : source,
                    parentId    : parent,
                    nOneIndexed : target.sort,
                };

                return await this.treeCreateAsNthChild(debug, trx, params);
            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        },
        treeCreateAfter: async function (...args) {

            let [debug, trx, opt = {}] = a(args);

            const {sourceId, targetId} = opt;

            const logic = async trx => {

                if ( targetId === undefined) {

                    throw th(`treeCreateAfter: targetId can't be undefined`);
                }

                const target = await this.treeFindOne(debug, trx, targetId);

                if ( ! target ) {

                    throw th(`treeCreateAfter: target not found by id: ${targetId}`);
                }

                if ( sourceId === undefined) {

                    throw th(`treeCreateAfter: sourceId can't be undefined`);
                }

                const source = await this.treeFindOne(debug, trx, sourceId);

                if ( ! source ) {

                    throw th(`treeCreateAfter: source not found by id: ${sourceId}`);
                }

                if ( target.pid === undefined) {

                    throw th(`treeCreateAfter: target.pid can't be undefined`);
                }

                const parent = await this.treeFindOne(debug, trx, target.pid);

                if ( ! parent ) {

                    throw th(`treeCreateAfter: parent not found by id: ${target.pid}`);
                }

                if ( parent.level === 1 ) {

                    throw th(`Can't use method treeCreateAfter() with root element of the tree`);
                }

                const params = {
                    sourceId    : source,
                    parentId    : parent,
                    nOneIndexed : target.sort + 1,
                };

                return await this.treeCreateAsNthChild(debug, trx, params);
            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        },
        treeCreateAsNthChild: async function (...args) {

            let [debug, trx, opt = {}] = a(args);

            let { sourceId, parentId, nOneIndexed, moveMode = false } = opt;

            const logic = async trx => {

                let source;

                if ( isObject(sourceId) ) {

                    source = sourceId;
                }
                else {

                    if ( sourceId === undefined) {

                        throw th(`treeCreateAsNthChild: sourceId can't be undefined`);
                    }

                    source = await this.treeFindOne(debug, trx, sourceId);
                }

                if ( ! source ) {

                    throw th(`treeCreateAsNthChild: source not found by id: ${sourceId}`);
                }

                moveMode || Object.keys(topt.columns).forEach(key => {

                    if ( source[key] !== null ) {

                        throw th(`treeCreateAsNthChild: source.${key} is not null, should be null: ` + toString(source));
                    }
                });

                let parent;

                if ( isObject(parentId) ) {

                    parent = parentId;
                }
                else {

                    if ( parentId === undefined) {

                        throw th(`treeCreateAsNthChild: parentId can't be undefined`);
                    }

                    parent = await this.treeFindOne(debug, trx, parentId);
                }

                if ( ! parent ) {

                    throw th(`treeCreateAsNthChild: parent not found by id: ${parentId}`);
                }

                Object.keys(topt.columns).forEach(key => {

                    if ( ! parent[key] ) {

                        if (key === 'pid') {

                            if (parent.level > 1) {

                                throw th(`treeMoveToNthChild: parent.${key} can't be falsy 3: ` + toString(parent));
                            }
                        }
                        else {

                            throw th(`treeMoveToNthChild: parent.${key} can't be falsy 4: ` + toString(parent));
                        }
                    }
                });

                const maxIndex = await this.queryColumn(debug, trx, `SELECT MAX(:sort:) + 1 FROM :table: WHERE :pid: = :id`, {
                    pid,
                    sort,
                    id: parent.id,
                });

                // no children then default 1
                if (maxIndex === null) {

                    nOneIndexed = 1;
                }
                else {

                    if (nOneIndexed > maxIndex || ! nOneIndexed) {

                        nOneIndexed = maxIndex;
                    }
                }

                if ( ! Number.isInteger(nOneIndexed) ) {

                    throw th(`treeCreateAsNthChild: nOneIndexed param is not an integer`)
                }

                if ( nOneIndexed < 1 ) {

                    nOneIndexed = 1;
                }

                let newl = parent.l + ( (nOneIndexed - 1) * 2) + 1;

                let newr = newl + 1;

                let rowUnderIndex = await this.queryOne(debug, trx, `select * from :table: WHERE :pid: = :id and :sort: = :s`, {
                    pid,
                    id: parent.id,
                    sort,
                    s: nOneIndexed
                });

                // run some operations to prepare children
                if ( (parent.r - parent.l) > 1 ) {

                    if ( rowUnderIndex) {

                        newl = rowUnderIndex[l];

                        newr = rowUnderIndex[r];
                    }
                    else {

                        const tmp = await this.queryOne(debug, trx, `select * from :table: WHERE :pid: = :id and :sort: = :s`, {
                            pid,
                            id: parent.id,
                            sort,
                            s: nOneIndexed - 1
                        });

                        newl = tmp[r] + 1;

                        newr = newl + 1;
                    }
                }

                if ( newr !== undefined && ( ! Number.isInteger(newr) || newr < 1 ) ) {

                    throw th(`treeCreateAsNthChild: newr is invalid: ` + toString(newr));
                }

                await this.query(debug, trx, `update :table: set :l: = :l: + 2 where :l: > :vl`, {
                    l,
                    vl       : newl - 1,
                });

                let rquery      = `update :table: set :r: = :r: + 2 where :id: = :id or :r: > :vr`;

                let rparams     = {
                    r,
                    vr      : newr - 1,
                    id      : parent.id,
                }

                if (rowUnderIndex && (rowUnderIndex[r] - rowUnderIndex[l]) > 1 ) {

                    rquery += ` or (:l: > :rvl and :r: < :rvr)`;

                    rparams.l   = l;

                    rparams.rvl  = rowUnderIndex[l];

                    rparams.rvr  = rowUnderIndex[r];
                }

                await this.query(debug, trx, rquery, rparams);

                const update = {
                    [pid]   : parent.id,
                    [level] : parent.level + 1,
                    [l]     : newl,
                    [sort]  : nOneIndexed,
                }

                update[r] = update[l] + 1;

                await this.update(debug, trx, update, source.id);

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
                await this.query(debug, trx, `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id ORDER BY :l:`, {
                    sort,
                    pid,
                    id      : parent.id,
                    l
                });
            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        },
        treeMoveToNthChild: async function (...args) {

            let [debug, trx, opt = {}] = a(args);

            let { sourceId, parentId, nOneIndexed, gate = false } = opt;

            gate = gate ?
                flag => {
                    throw new Error(`#${flag}`);
                } :
                () => {}
            ;

            const logic = async trx => {

                let source;

                if ( isObject(sourceId) ) {

                    source = sourceId;
                }
                else {

                    if ( sourceId === undefined) {

                        throw th(`treeMoveToNthChild: sourceId can't be undefined`);
                    }

                    source = await this.treeFindOne(debug, trx, sourceId);
                }

                if ( ! source ) {

                    throw th(`treeMoveToNthChild: source not found by id: ${sourceId}`);
                }

                if (source.level < 2) {

                    throw th(`treeMoveToNthChild: can't move root element`);
                }

                Object.keys(topt.columns).forEach(key => {

                    if ( ! source[key] ) {

                        throw th(`treeMoveToNthChild: source.${key} can't be falsy: ` + toString(source));
                    }
                });

                let parent;

                if ( isObject(parentId) ) {

                    parent = parentId;
                }
                else {

                    if ( parentId === undefined) {

                        throw th(`treeMoveToNthChild: parentId can't be undefined`);
                    }

                    parent = await this.treeFindOne(debug, trx, parentId);
                }

                if ( ! parent ) {

                    throw th(`treeMoveToNthChild: parent not found by id: ${parentId}`);
                }

                Object.keys(topt.columns).forEach(key => {

                    if ( ! parent[key] ) {

                        if (key === 'pid') {

                            if (parent.level > 1) {

                                throw th(`treeMoveToNthChild: parent.${key} can't be falsy 1: ` + toString(parent));
                            }
                        }
                        else {

                            throw th(`treeMoveToNthChild: parent.${key} can't be falsy 2: ` + toString(parent));
                        }
                    }
                });

                const maxIndex = await this.queryColumn(debug, trx, `SELECT MAX(:sort:) + 1 FROM :table: WHERE :pid: = :id`, {
                    pid,
                    sort,
                    id: parent.id,
                });

                let indexParamNotGiven = (nOneIndexed === undefined);

                // no children then default 1
                if (maxIndex === null) {

                    nOneIndexed = 1;
                }
                else {

                    if (nOneIndexed > maxIndex || ! nOneIndexed) {

                        nOneIndexed = maxIndex;
                    }
                }

                if ( ! Number.isInteger(nOneIndexed) ) {

                    throw th(`treeMoveToNthChild: nOneIndexed param is not an integer`)
                }

                if ( nOneIndexed < 1 ) {

                    nOneIndexed = 1;
                }

                if ( source.id === parent.id || ( parent.l > source.l && parent.r < source.r ) ) {

                    gate('8');

                    throw th(`treeMoveToNthChild: #8 can't move element as a child of itself`);
                }

                if ( source.pid === parent.id && source.sort === nOneIndexed) {

                    gate('same-index');

                    throw th(`treeMoveToNthChild: can't move element as a child of the same parent '${parent.id}' and to the same index '${nOneIndexed}'`);
                }

                let rowUnderIndex = await this.queryOne(debug, trx, `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: WHERE :pid: = :id and :sort: = :s`, {
                    ...topt.columns,
                    id: parent.id,
                    s: nOneIndexed
                });

                if ( rowUnderIndex ) {

                    Object.keys(topt.columns).forEach(key => {

                        if ( ! rowUnderIndex[key] ) {

                            throw th(`treeMoveToNthChild: parent.${key} can't be falsy: ` + toString(rowUnderIndex));
                        }
                    });
                }

                switch(true) {
                    case ( source.level === (parent.level + 1) && ( source.sort < nOneIndexed ) ): // #1

                        if (source.sort >= (maxIndex - 1)) {

                            gate('already-last');

                            throw th(`treeMoveToNthChild: can't move last element to the end, because it's already at the end because it's "last"`);
                        }

                        gate(1);

                        if ( ! rowUnderIndex ) {

                            rowUnderIndex = await this.queryOne(debug, trx, `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: WHERE :pid: = :id and :sort: = :s`, {
                                ...topt.columns,
                                id: parent.id,
                                s: nOneIndexed - 1
                            });
                        }

                        // flip
                        await this.query(debug, trx, `update :table: set :sort: = -:sort: where :l: >= :vl and :r: <= :vr`, {
                            sort,
                            l,
                            r,
                            vl: source.l,
                            vr: source.r,
                        });

                        const offset = source.r - source.l + 1;

                        // move up
                        await this.query(debug, trx, `
UPDATE :table: SET :l: = :l: - :offset, :r: = :r: - :offset 
WHERE 
(
  (:l: >= :sl AND :l: <= :tl AND :r: <= :tr AND :r: >= :sr)
  OR (:l: >= :tl AND :r: <= :tr)
)  
AND :sort: > 0`, {
                            sort,
                            l,
                            r,
                            sl: source.l,
                            sr: source.r,
                            tl: rowUnderIndex.l,
                            tr: rowUnderIndex.r,
                            offset,
                        });

                        // move down
                        await this.query(debug, trx, "UPDATE :table: SET :l: = :l: + :offset, :r: = :r: + :offset, :sort: = -:sort: where :sort: < 0", {
                            sort,
                            l,
                            r,
                            offset: rowUnderIndex.r - source.l - offset + 1,
                        })

                        await this.query(debug, trx, `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id ORDER BY :l:`, {
                            sort,
                            pid,
                            id      : parent.id,
                            l
                        });

                        break;
                    case source.level === (parent.level + 1): // #2

                        gate(2);

                        break;
                    case ( ( source.level <= parent.level ) && (source.l > parent.l) ): // #4

                        gate(4);

                        break;
                    case ( source.level <= parent.level ): // #3

                        gate(3);

                        break;
                    case ( source.level > parent.level ): // #5  ?????

                        gate(5);

                        // throw new Error('test');

                        // gate(6);
                    {

                        if ( ! rowUnderIndex ) {

                            rowUnderIndex = await this.queryOne(debug, trx, `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: WHERE :pid: = :id and :sort: = :s`, {
                                ...topt.columns,
                                id: parent.id,
                                s: nOneIndexed - 1
                            });
                        }

                        // flip
                        await this.treeDelete(debug, trx, {
                            id: source,
                            flip: true,
                        });

                        await this.treeCreateAsNthChild({
                            sourceId    : source,
                            parentId    : parent,
                            nOneIndexed,
                            moveMode    : true,
                        });
                        // await this.query(debug, trx, `update :table: set :sort: = -:sort:, :l: = :l: + 1000, :r: = :r: + 1000 where :l: >= :vl and :r: <= :vr`, {
                        // // await this.query(debug, trx, `update :table: set :sort: = -:sort: where :l: >= :vl and :r: <= :vr`, {
                        //     sort,
                        //     l,
                        //     r,
                        //     vl: source.l,
                        //     vr: source.r,
                        // });
                                    // await this.query(debug, trx, `delete from :table: where :l: >= :vl and :r: <= :vr`, {
                                    //     // await this.query(debug, trx, `update :table: set :sort: = -:sort: where :l: >= :vl and :r: <= :vr`, {
                                    //     sort,
                                    //     l,
                                    //     r,
                                    //     vl: source.l,
                                    //     vr: source.r,
                                    // })

                        // await this.query(debug, trx, `update :table: set :l: = :l: - :offset where :l: > :vl and :sort: > 0`, {
                        //     l,
                        //     sort,
                        //     vl: source.l,
                        //     offset: source.r - source.l + 1,
                        // })
                        //
                        // await this.query(debug, trx, `update :table: set :r: = :r: - :offset where :r: > :vr and :sort: > 0`, {
                        //     r,
                        //     sort,
                        //     vr: source.r,
                        //     offset: source.r - source.l + 1,
                        // })

                                    // await this.query(debug, trx, `update :table: set :pid: = :ppid, :sort: where :id: = :id`, {
                                    //     pid,
                                    //     l,
                                    //     r,
                                    //     ppid: parent.id,
                                    //     id: source.id,
                                    // })

//                         const offset = source.r - source.l + 1;
//
//                         // move up
//                         await this.query(debug, trx, `
// UPDATE :table: SET :l: = :l: - :offset, :r: = :r: - :offset
// WHERE
// (
//   (:l: >= :sl AND :l: <= :tl AND :r: <= :tr AND :r: >= :sr)
//   OR (:l: >= :tl AND :r: <= :tr)
// )
// AND :sort: > 0`, {
//                             sort,
//                             l,
//                             r,
//                             sl: source.l,
//                             sr: source.r,
//                             tl: rowUnderIndex.l,
//                             tr: rowUnderIndex.r,
//                             offset,
//                         });

//                         const offset = source.r - source.l + 1;
//
//                         // move up
//                         await this.query(debug, trx, `
// UPDATE :table: SET :l: = :l: - :offset, :r: = :r: - :offset
// WHERE
// (
//   (:l: >= :sl AND :l: <= :tl AND :r: <= :tr AND :r: >= :sr)
//   OR (:l: >= :tl AND :r: <= :tr)
// )
// AND :sort: > 0`, {
//                             sort,
//                             l,
//                             r,
//                             sl: source.l,
//                             sr: source.r,
//                             tl: rowUnderIndex.l,
//                             tr: rowUnderIndex.r,
//                             offset,
//                         });
//
//                         // move down
//                         await this.query(debug, trx, "UPDATE :table: SET :l: = :l: + :offset, :r: = :r: + :offset, :sort: = -:sort: where :sort: < 0", {
//                             sort,
//                             l,
//                             r,
//                             offset: rowUnderIndex.r - source.l - offset + 1,
//                         })
//
//                         await this.query(debug, trx, `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id ORDER BY :l:`, {
//                             sort,
//                             pid,
//                             id      : parent.id,
//                             l
//                         });
                    }
                        break;
                    default:
                        throw th(`treeMoveToNthChild: unhandled/unknown case`);
                        break;
                }

            };

            if (trx) {

                return await logic.call(this, trx);
            }

            return await this.knex.transaction(logic);
        },
    }
}