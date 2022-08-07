const isObject = require("nlab/isObject");

const isArray = require("nlab/isArray");

const log = require("inspc");

const abstract = require(".");

// const extend            = abstract.extend;

const prototype = abstract.prototype_common;

const Opt = prototype.Opt;

const promiseall = require("nlab/promiseall");

const th = (msg) => new Error(`nestedset.js: ${msg}`);

const toString = (data) => {
  log.start();

  log.dump(data);

  return log.get(false);
};

/**
 * const nestedset = require('./nestedset');
 *
 * nestedset({
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
module.exports = (topt) => {
  if (!isObject(topt)) {
    throw th(`topt is not an object`);
  }

  if (!isObject(topt.columns)) {
    throw th(`topt.columns is not an object`);
  }

  const { l, r, level, pid, sort } = topt.columns;

  Object.keys(topt.columns).forEach((key) => {
    if (typeof topt.columns[key] !== "string") {
      throw th(`topt.columns.${key} is not a string`);
    }

    key = key.trim();

    if (!topt.columns[key]) {
      throw th(`topt.columns.${key} is an empty string`);
    }
  });

  return {
    /**
     * Method to ensure that there is valid root node in the database
     */
    treeInit: async function (opt, data) {

      opt = {
        ...opt,
        both: false,
      };

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        const root = await this.queryOne(opt,
          `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: where :level: = 1`,
          {
            ...topt.columns,
          }
        );

        const count = await this.count(opt);

        if (root) {
          if (root.level !== 1) {
            throw new Error(
              `treeInit(): current root element level value is incorrect: ` +
                toString(root)
            );
          }

          if (root.sort !== 1) {
            throw new Error(
              `treeInit(): current root element sort value is incorrect: ` +
                toString(root)
            );
          }

          if (root.l !== 1) {
            throw new Error(
              `treeInit(): current root element l value is incorrect: ` +
                toString(root)
            );
          }

          const expectedR = count * 2;

          if (root.r !== expectedR) {
            throw new Error(
              `treeInit(): current root element r value is incorrect, should be (${expectedR}): ` +
                toString(root)
            );
          }

          return root;
        }

        if (count) {
          throw new Error(
            `treeInit(): if there is no root element then table should be empty but '${count}' elements found in table`
          );
        }

        const id = await this.insert(opt, {
          ...data,
          [level]: 1,
          [sort]: 1,
          [l]: 1,
          [r]: 2,
        });

        return await this.treeFindOne(opt, id);
      });
    },
    treeSkeleton: function (opt, select = "") {

      opt = {
        ...opt,
        both: false,
      };

      if (typeof select === "string") {
        select = select.trim();

        if (select) {
          select = ", " + select;
        }
      }

      return this.query(
        opt,
        `SELECT :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort${select} FROM :table: t ORDER BY l, sort FOR UPDATE`,
        {
          ...topt.columns,
        }
      );
    },
    treeFindOne: function (opt, id) {

      opt = {
        ...opt,
        both: false,
      };

      return this.queryOne(
        opt,
        `SELECT :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort FROM :table: t WHERE :id: = :id FOR UPDATE`,
        {
          ...topt.columns,
          id,
        }
      );
    },
    assemble: async function (opt, select, normalize = false) {

      let list = await this.treeSkeleton(opt, select);

      const obj = list.reduce((acc, row) => {
        acc[row.id] = row;

        return acc;
      }, {});

      for (let i = 0, l = list.length; i < l; i += 1) {
        if (list[i].pid && obj[list[i].pid]) {
          if (!isArray(obj[list[i].pid].children)) {
            obj[list[i].pid].children = [];
          }

          obj[list[i].pid].children.push(list[i]);
        }
      }

      return {
        tree: list.filter((l) => !l.pid),
        list,
      };
    },
    /**
     * For manual inspection in DB:
     *      SELECT id, parent_id pid, level level, l, r, sort s, t.title FROM tree t ORDER BY l, s
     */
    treeCheckIntegrity: (function () {
      function th(p, nodeId, side, expectedIndex, found) {
        return new Error(
          `LRTree integrity error: Node id: '${nodeId}' key: '${side}' should have value '${expectedIndex}', found '${found}', path to node '${p}'`
        );
      }

      function check(list, k = 1, p = "", pid = false, level = 1) {
        if (Array.isArray(list)) {
          for (let i = 0, l = list.length, t, key; i < l; i += 1) {
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

      return async function (opt, select = "",
                             normalize = false // string || function
      ) {

        let { tree, list } = await this.assemble(opt, select, normalize);

        let valid = true;

        let invalidMsg;

        try {
          check(tree);
        } catch (e) {
          valid = false;

          invalidMsg = e.message;

          log.dump({
            checkError: e.message,
          });
        }

        if (normalize !== false) {
          if (typeof this[normalize] !== "function") {
            throw new Error(
              `knex-abstract, nextedset.js, treeCheckIntegrity({}): normalize function '${normalize}' is defined but there is no such method in '${this.__table}' manager`
            );
          }

          await promiseall(list.map((d) => this[normalize](opt, d)));
        }

        return {
          tree,
          valid,
          invalidMsg,
        };
      };
    })(),
    treeFix: (function () {
      async function fix(opt, tree, k = 1, p = "", _pid = false, lvl = 1) {
        if (Array.isArray(tree)) {
          for (let i = 0, ll = tree.length, t, key; i < ll; i += 1) {
            const toFix = {};

            t = tree[i];

            key = p ? `${p}.${t.id}` : t.id;

            if (t.l !== k) {
              toFix[l] = k;
            }

            k += 1;

            if (Array.isArray(t.children)) {
              k = await fix.call(
                this,
                opt,
                t.children,
                k,
                key,
                t.id,
                lvl + 1
              );
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
              await this.update(opt, toFix, t.id);
            }

            k += 1;
          }
        }

        return k;
      }

      return async function (opt) {

        opt = {
          ...opt,
          both: false,
        };

        return await this.transactify(opt.trx, async (trx) => {

          opt.trx = trx;

          let { tree } = await this.assemble(opt);

          await fix.call(this, opt, tree);

          return tree;
        });
      };
    })(),
    treeDelete: async function (opt, id) {

      opt = {
        ...opt,
        both: false,
      };

      let flip = false;

      if (isObject(id)) {
        if (id.flip) {
          flip = true;
        }

        id = id.id;
      }

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        let found;

        if (isObject(id)) {
          found = id;

          id = found.id;
        } else {
          if (id === undefined) {
            throw th(`treeDelete: id can't be undefined`);
          }

          found = await this.treeFindOne(opt, id);
        }

        if (!found) {
          throw th(`treeDelete: node not found by id: ${id}`);
        }

        if (found.level === 1) {
          throw th(
            `Can't use method treeDelete() with root element of the tree`
          );
        }

        if (typeof found.l !== "number") {
          throw th(`treeDelete: found.l is not a number`);
        }

        if (found.l < 1) {
          throw th(`treeDelete: found.l is smaller than 1`);
        }

        if (typeof found.r !== "number") {
          throw th(`treeDelete: found.r is not a number`);
        }

        if (found.r < 1) {
          throw th(`treeDelete: found.r is smaller than 1`);
        }

        if (found.l >= found.r) {
          throw th(`treeDelete: found.l is >= than found.r`);
        }

        const parent = await this.treeFindOne(opt, found.pid);

        const howManyToRemove = (found.r - found.l + 1) / 2;

        if (!Number.isInteger(howManyToRemove)) {
          throw th(
            `treeDelete: howManyToRemove is not integer, found.l: ${found.l}, found.r: ${found.r}, howManyToRemove: ` +
              JSON.stringify(howManyToRemove)
          );
        }

        let result;

        if (flip) {
          result = await this.query(
            opt,
            `update :table: set :sort: = -:sort: where :l: >= :vl and :r: <= :vr`,
            {
              sort,
              l,
              r,
              vl: found.l,
              vr: found.r,
            }
          );
        } else {
          result = await this.query(
            opt,
            `delete from :table: where :l: >= :vl and :r: <= :vr`,
            {
              l,
              r,
              vl: found.l,
              vr: found.r,
            }
          );
        }

        if (result.affectedRows !== howManyToRemove) {
          throw th(
            `treeDelete: howManyToRemove is prognosed to: '${howManyToRemove}' but after remove result.affectedRows is: '${result.affectedRows}'`
          );
        }

        await this.query(
          opt,
          `update :table: set :l: = :l: - :offset where :l: > :vl and :sort: > 0`,
          {
            l,
            sort,
            offset: howManyToRemove * 2,
            vl: found.l,
          }
        );

        await this.query(
          opt,
          `update :table: set :r: = :r: - :offset where :r: > :vr and :sort: > 0`,
          {
            r,
            sort,
            offset: howManyToRemove * 2,
            vr: found.r,
          }
        );

        /**
                 * https://github.com/mysqljs/mysql/issues/1751#issue-234563643
                 * Require config like:
                 *
                    connection: {
                        host                : process.env.MYSQL_HOST,
                        port                : process.env.MYSQL_PORT,
                        user                : process.env.MYSQL_USER,
                        password            : process.env.MYSQL_PASS,
                        database            : process.env.MYSQL_DB,
                        multipleStatements  : true,
                    },
                 */

        let excludeFlipped = "";

        if (flip) {
          excludeFlipped = ` AND :sort: > 0`;
        }

        // return;
        await this.query(
          opt,
          `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id${excludeFlipped} ORDER BY :l:`,
          {
            sort,
            pid,
            id: parent.id,
            l,
          }
        );
      });
    },
    treeMoveBefore: async function (opt, opt2) {

      opt = {
        ...opt,
        both: false,
      };

      const { sourceId, targetId, strict = false } = opt2;

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        if (targetId === undefined) {
          throw th(`treeMoveBefore: targetId can't be undefined`);
        }

        const target = await this.treeFindOne(opt, targetId);

        if (!target) {
          throw th(`treeMoveBefore: target not found by id: ${targetId}`);
        }

        if (target.level === 1) {
          throw th(
            `Can't use method treeMoveBefore() with root element of the tree`
          );
        }

        if (sourceId === undefined) {
          throw th(`treeMoveBefore: sourceId can't be undefined`);
        }

        const source = await this.treeFindOne(opt, sourceId);

        if (!source) {
          throw th(`treeMoveBefore: source not found by id: ${sourceId}`);
        }

        if (target.pid === undefined) {
          throw th(`treeMoveBefore: target.pid can't be undefined`);
        }

        const parent = await this.treeFindOne(opt, target.pid);

        if (!parent) {
          throw th(`treeMoveBefore: parent not found by id: ${target.pid}`);
        }

        const params = {
          sourceId: source.id,
          parentId: parent.id,
          nOneIndexed:
            target.sort +
            (source.pid == target.pid && source.sort < target.sort ? -1 : 0),
          strict,
        };

        return await this.treeMoveToNthChild(opt, params);
      });
    },
    treeCreateBefore: async function (opt, opt2) {

      opt = {
        ...opt,
        both: false,
      };

      const { sourceId, targetId, strict = false } = opt2;

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        if (targetId === undefined) {
          throw th(`treeCreateAfter: targetId can't be undefined`);
        }

        const target = await this.treeFindOne(opt, targetId);

        if (!target) {
          throw th(`treeCreateAfter: target not found by id: ${targetId}`);
        }

        if (target.level === 1) {
          throw th(
            `Can't use method treeCreateAfter() with root element of the tree`
          );
        }

        if (sourceId === undefined) {
          throw th(`treeCreateAfter: sourceId can't be undefined`);
        }

        const source = await this.treeFindOne(opt, sourceId);

        if (!source) {
          throw th(`treeCreateAfter: source not found by id: ${sourceId}`);
        }

        if (target.pid === undefined) {
          throw th(`treeCreateAfter: target.pid can't be undefined`);
        }

        const parent = await this.treeFindOne(opt, target.pid);

        if (!parent) {
          throw th(`treeCreateAfter: parent not found by id: ${target.pid}`);
        }

        const params = {
          sourceId: source,
          parentId: parent.id,
          nOneIndexed: target.sort,
          strict,
        };

        return await this.treeCreateAsNthChild(opt, params);
      });
    },
    treeMoveAfter: async function (opt, opt2) {

      opt = {
        ...opt,
        both: false,
      };

      const { sourceId, targetId, strict = false } = opt2;

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        if (targetId === undefined) {
          throw th(`treeMoveAfter: targetId can't be undefined`);
        }

        const target = await this.treeFindOne(opt, targetId);

        if (!target) {
          throw th(`treeMoveAfter: target not found by id: ${targetId}`);
        }

        if (target.level === 1) {
          throw th(
            `Can't use method treeMoveAfter() with root element of the tree`
          );
        }

        if (sourceId === undefined) {
          throw th(`treeMoveAfter: sourceId can't be undefined`);
        }

        const source = await this.treeFindOne(opt, sourceId);

        if (!source) {
          throw th(`treeMoveAfter: source not found by id: ${sourceId}`);
        }

        if (target.pid === undefined) {
          throw th(`treeMoveAfter: target.pid can't be undefined`);
        }

        const parent = await this.treeFindOne(opt, target.pid);

        if (!parent) {
          throw th(`treeMoveAfter: parent not found by id: ${target.pid}`);
        }

        const params = {
          sourceId: source.id,
          parentId: parent.id,
          nOneIndexed:
            target.sort +
            (source.pid == target.pid && source.sort < target.sort ? 0 : 1),
          strict,
        };

        return await this.treeMoveToNthChild(opt, params);
      });
    },
    treeCreateAfter: async function (opt, opt2) {

      opt = {
        ...opt,
        both: false,
      };

      const { sourceId, targetId, strict = false } = opt2;

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        if (targetId === undefined) {
          throw th(`treeCreateAfter: targetId can't be undefined`);
        }

        const target = await this.treeFindOne(opt, targetId);

        if (!target) {
          throw th(`treeCreateAfter: target not found by id: ${targetId}`);
        }

        if (target.level === 1) {
          throw th(
            `Can't use method treeCreateAfter() with root element of the tree`
          );
        }

        if (sourceId === undefined) {
          throw th(`treeCreateAfter: sourceId can't be undefined`);
        }

        const source = await this.treeFindOne(opt, sourceId);

        if (!source) {
          throw th(`treeCreateAfter: source not found by id: ${sourceId}`);
        }

        if (target.pid === undefined) {
          throw th(`treeCreateAfter: target.pid can't be undefined`);
        }

        const parent = await this.treeFindOne(opt, target.pid);

        if (!parent) {
          throw th(`treeCreateAfter: parent not found by id: ${target.pid}`);
        }

        const params = {
          sourceId: source,
          parentId: parent.id,
          nOneIndexed: target.sort + 1,
          strict,
        };

        return await this.treeCreateAsNthChild(opt, params);
      });
    },
    treeCreateAsNthChild: async function (opt, opt2) {

      opt = {
        ...opt,
        both: false,
      };

      let {
        sourceId,
        parentId,
        nOneIndexed, // standard parameters
        moveMode = false, // parameters for internal use - usually optimalization
      } = opt2;

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        let source;

        if (isObject(sourceId)) {
          source = sourceId;

          sourceId = source.id;
        } else {
          if (sourceId === undefined) {
            throw th(`treeCreateAsNthChild: sourceId can't be undefined`);
          }

          source = await this.treeFindOne(opt, sourceId);
        }

        if (!source) {
          throw th(`treeCreateAsNthChild: source not found by id: ${sourceId}`);
        }

        moveMode ||
          Object.keys(topt.columns).forEach((key) => {
            if (source[key] !== null) {
              throw th(
                `treeCreateAsNthChild: source.${key} is not null, should be null: ` +
                  toString(source)
              );
            }
          });

        if (isObject(parentId)) {
          throw th(
            `treeCreateAsNthChild: parentId can't be an object: ` +
              toString(parentId)
          );
        }

        if (parentId === undefined) {
          throw th(`treeCreateAsNthChild: parentId can't be undefined`);
        }

        const parent = await this.treeFindOne(opt, parentId);

        if (!parent) {
          throw th(`treeCreateAsNthChild: parent not found by id: ${parentId}`);
        }

        Object.keys(topt.columns).forEach((key) => {
          if (!parent[key]) {
            if (key === "pid") {
              if (parent.level > 1) {
                throw th(
                  `treeMoveToNthChild: parent.${key} can't be falsy 3: ` +
                    toString(parent)
                );
              }
            } else {
              throw th(
                `treeMoveToNthChild: parent.${key} can't be falsy 4: ` +
                  toString(parent)
              );
            }
          }
        });

        const maxIndex = await this.queryColumn(
          opt,
          `SELECT MAX(:sort:) + 1 FROM :table: WHERE :pid: = :id and :sort: > 0`,
          {
            pid,
            sort,
            id: parent.id,
          }
        );

        // no children then default 1
        if (maxIndex === null) {
          nOneIndexed = 1;
        } else {
          if (nOneIndexed > maxIndex || !nOneIndexed) {
            nOneIndexed = maxIndex;
          }
        }

        if (!Number.isInteger(nOneIndexed)) {
          throw th(`treeCreateAsNthChild: nOneIndexed param is not an integer`);
        }

        if (nOneIndexed < 1) {
          nOneIndexed = 1;
        }

        let rowUnderIndex = await this.queryOne(
          opt,
          `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: WHERE :pid: = :id and :sort: = :s and :sort: > 0 FOR UPDATE`,
          {
            ...topt.columns,
            id: parent.id,
            s: nOneIndexed,
          }
        );

        let lastNode;

        if (!rowUnderIndex) {
          lastNode = await this.queryOne(
            opt,
            `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: WHERE :pid: = :id and :sort: = :s and :sort: > 0 FOR UPDATE`,
            {
              ...topt.columns,
              id: parent.id,
              s: nOneIndexed - 1,
            }
          );
        }

        let nl = parent.l + 1, // precalculation if parent will have no children
          nr = undefined; // can't determine at this point yet
        // run some operations to prepare children
        if (parent.r - parent.l > 1) {
          if (rowUnderIndex) {
            nl = rowUnderIndex.l;
          } else {
            nl = lastNode.r + 1;
          }

          if (moveMode) {
            nr = nl + (source.r - source.l);
          } else {
            nr = nl + 1;
          }
        }

        if (nr !== undefined && (!Number.isInteger(nr) || nr < 1)) {
          throw th(`treeCreateAsNthChild: nr is invalid: ` + toString(nr));
        }

        await this.query(
          opt,
          `update :table: set :l: = :l: + :offset where :l: > :vl and :sort: > 0`,
          {
            l,
            sort,
            vl: nl - 1,
            offset: moveMode ? source.r - source.l + 1 : 2,
          }
        );

        const offset = moveMode ? source.r - source.l + 1 : 2;

        let rquery = `
update            :table: 
set               :r: = :r: + :offset 
where             (
                    (:r: > :pl or :id: = :id) 
            and not (:l: > :pl && :r: < :nl)  
                and :sort: > 0
                  )             
`;

        let rparams = {
          l,
          r,
          pl: parent.l,
          nl,
          sort,
          pid,
          n: nOneIndexed,
          id: parent.id,
          offset,
        };

        // if (rowUnderIndex && (rowUnderIndex.r - rowUnderIndex.l) > 1 ) {
        //
        //     rquery += ` or (:l: > :rvl and :r: < :rvr)`;
        //
        //     rparams.l   = l;
        //
        //     rparams.rvl  = rowUnderIndex.l;
        //
        //     rparams.rvr  = rowUnderIndex.r;
        // }

        await this.query(opt, rquery, rparams);

        if (moveMode) {
          const offset = nl - source.l;

          const levelOffset = source.level - (parent.level + 1);

          await this.query(
            opt,
            `UPDATE :table: SET :l: = :l: + :offset, :r: = :r: + :offset, :sort: = -:sort:, :level: = :level: - :levelOffset WHERE :sort: < 0`,
            {
              l,
              r,
              sort,
              offset,
              level,
              levelOffset,
            }
          );

          await this.update(
            opt,
            {
              [pid]: parent.id,
            },
            source.id
          );
        } else {
          const update = {
            [pid]: parent.id,
            [level]: parent.level + 1,
            [l]: nl,
            [sort]: nOneIndexed,
          };

          update[r] = update[l] + 1;

          await this.update(opt, update, source.id);
        }

        /**
                 * https://github.com/mysqljs/mysql/issues/1751#issue-234563643
                 * Require config like:
                 *
                 connection: {
                        host        : process.env.MYSQL_HOST,
                        port        : process.env.MYSQL_PORT,
                        user        : process.env.MYSQL_USER,
                        password    : process.env.MYSQL_PASS,
                        database    : process.env.MYSQL_DB,
                        multipleStatements: true,
                    },
                 */
        await this.query(
          opt,
          `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id ORDER BY :l:`,
          {
            sort,
            pid,
            id: parent.id,
            l,
          }
        );
      });





















    },
    treeMoveToNthChild: async function (opt, opt2) {

      opt = {
        ...opt,
        both: false,
      };

      let {
        sourceId,
        parentId,
        nOneIndexed, // standard parameters
        gate = false, // parameters for internal use - usually optimalization
        strict = false,
      } = opt2;

      gate = gate
        ? (flag) => {
            throw new Error(`#${flag}`);
          }
        : () => {};

      return await this.transactify(opt.trx, async (trx) => {

        opt.trx = trx;

        if (sourceId === undefined) {
          throw th(`treeMoveToNthChild: sourceId can't be undefined`);
        }

        const source = await this.treeFindOne(opt, sourceId);

        if (!source) {
          throw th(`treeMoveToNthChild: source not found by id: ${sourceId}`);
        }

        if (source.level < 2) {
          throw th(`treeMoveToNthChild: can't move root element`);
        }

        Object.keys(topt.columns).forEach((key) => {
          if (!source[key]) {
            throw th(
              `treeMoveToNthChild: source.${key} can't be falsy: ` +
                toString(source)
            );
          }
        });

        if (parentId === undefined) {
          throw th(`treeMoveToNthChild: parentId can't be undefined`);
        }

        const parent = await this.treeFindOne(opt, parentId);

        if (!parent) {
          throw th(`treeMoveToNthChild: parent not found by id: ${parentId}`);
        }

        Object.keys(topt.columns).forEach((key) => {
          if (!parent[key]) {
            if (key === "pid") {
              if (parent.level > 1) {
                throw th(
                  `treeMoveToNthChild: parent.${key} can't be falsy 1: ` +
                    toString(parent)
                );
              }
            } else {
              throw th(
                `treeMoveToNthChild: parent.${key} can't be falsy 2: ` +
                  toString(parent)
              );
            }
          }
        });

        const maxIndex = await this.queryColumn(
          opt,
          `SELECT MAX(:sort:) + 1 FROM :table: WHERE :pid: = :id`,
          {
            pid,
            sort,
            id: parent.id,
          }
        );

        // no children then default 1
        if (maxIndex === null) {
          nOneIndexed = 1;
        } else {
          if (nOneIndexed > maxIndex || !nOneIndexed) {
            nOneIndexed = maxIndex;
          }
        }

        if (!Number.isInteger(nOneIndexed)) {
          throw th(`treeMoveToNthChild: nOneIndexed param is not an integer`);
        }

        if (nOneIndexed < 1) {
          nOneIndexed = 1;
        }

        if (
          source.id === parent.id ||
          (parent.l > source.l && parent.r < source.r)
        ) {
          gate("8");

          throw th(
            `treeMoveToNthChild: #8 can't move element as a child of itself`
          );
        }

        if (source.pid === parent.id && source.sort === nOneIndexed) {
          gate("same-index");

          if (strict) {
            throw th(
              `treeMoveToNthChild: can't move element as a child of the same parent '${parent.id}' and to the same index '${nOneIndexed}'`
            );
          }

          return;
        }

        // let rowUnderIndex = await this.queryOne(opt, `select :id: id, :pid: pid, :level: level, :l: l, :r: r, :sort: sort from :table: WHERE :pid: = :id and :sort: = :s FOR UPDATE`, {
        //     ...topt.columns,
        //     id: parent.id,
        //     s: nOneIndexed
        // });
        //
        // if ( rowUnderIndex ) {
        //
        //     Object.keys(topt.columns).forEach(key => {
        //
        //         if ( ! rowUnderIndex[key] ) {
        //
        //             throw th(`treeMoveToNthChild: parent.${key} can't be falsy: ` + toString(rowUnderIndex));
        //         }
        //     });
        // }

        switch (true) {
          case source.pid === parent.id && source.sort < nOneIndexed: // #1
            if (source.sort >= maxIndex - 1) {
              gate("already-last");

              if (strict) {
                throw th(
                  `treeMoveToNthChild: can't move last element to the end, because it's already at the end because it's "last"`
                );
              }

              return;
            }

            gate(1);

          // break;
          case source.level === parent.level + 1: // #2
            gate(2);

          // break;
          case source.level <= parent.level && source.l > parent.l: // #4
            gate(4);

          // break;
          case source.level <= parent.level: // #3
            gate(3);

          // break;
          // case ( source.level > parent.level ): // #5  ?????
          default:
            gate(5);

            // gate(6);

            // flip

            await this.treeDelete(opt, {
              id: source,
              flip: true,
            });

            await this.treeCreateAsNthChild(opt, {
              sourceId: source,
              parentId: parent.id, // don't pass object to force to retrieve parent again
              nOneIndexed,
              moveMode: true,
            });
        }
      });
    },
  };
};
