const path = require('path');

const fs = require('fs');

const log = require('inspc');

const express = require('express');

const isObject = require('nlab/isObject');

const isArray = require('nlab/isArray');

const yaml = require('js-yaml');

const {safeDump} = yaml;

require('dotenv-up')(
  {
    override: false,
    deep: 1,
  },
  true,
  'manual'
);

const fixturesTool = require('./test/lr-tree-model/tree-fixtures');

const host = process.env.HOST;

const port = process.env.PORT;

const {Router} = express;

const app = express();

const server = require('http').createServer(app);

const io = require('socket.io')(server); // io

app.use(express.static('.'));

app.use(express.urlencoded({extended: false}));

app.use(express.json());

const knex = require('./src');

knex.init(require('./test/lr-tree-model/config'));

const fixtures = fixturesTool({
  // yamlFile: path.resolve(__dirname, './test/lr-tree-model/tree-fixture-sm.yml'),
  yamlFile: path.resolve(__dirname, './test/lr-tree-model/tree-fixture-server-test-set.yml'),
  knex,
});

const emit = require('./test/lr-tree-model/io')({
  io,
});

io.on('connection', (socket) => {
  const mtree = knex().model.tree;

  function enrich(data) {
    if (isArray(data)) {
      return data.map((a) => enrich(a));
    }

    if (isObject(data)) {
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = enrich(data[key]);

        return acc;
      }, {});
    }

    if (typeof data === 'number' || data === null) {
      return {
        d: data,
        v: true,
      };
    }

    return data;
  }

  function check(list, k = 1, p = '', pid = false, level = 1, operation = {}) {
    if (Array.isArray(list)) {
      let ii = 0;
      for (let i = 0, l = list.length, t, key; i < l; i += 1) {
        t = list[i];

        if (t.id.d === operation.sourceId) {
          t.operation = 'source';
        }

        if (t.id.d === operation.parentId) {
          t.operation = 'parent';
        }

        let wrong = !(t.sort.d > 0);

        if (t.sort.d < 0) {
          t.sort.n = true;
        }

        key = p ? `${p}.${t.id.d}` : t.id.d;

        if (t.sort.d > 0 && t.l.d !== k) {
          t.l.v = wrong;
        }

        if (t.sort.d > 0) {
          k += 1;

          ii += 1;
        }

        if (Array.isArray(t.children)) {
          k = check(t.children, k, key, t.id.d, level + 1, operation);
        }

        if (t.r.d !== k) {
          t.r.v = wrong;
        }

        if (pid && t.pid.d !== pid) {
          t.pid.v = wrong;
        }

        if (t.level.d !== level) {
          t.level.v = wrong;
        }

        if (t.sort.d !== ii) {
          t.sort.v = wrong;
        }

        if (t.sort.d > 0) {
          k += 1;
        }
      }
    }

    return k;
  }

  const checkIntegrity = (function () {
    return async (operation) => {
      const data = await mtree.treeCheckIntegrity('t.title');

      const enriched = enrich(JSON.parse(JSON.stringify(data.tree)));

      const checked = JSON.parse(JSON.stringify(enriched));

      check(checked, 1, '', false, 1, operation);

      emit('tobrowser', {
        old: data,
        checked,
      });
    };
  })();

  console.log('connect..');

  socket.on('reset', async (data) => {
    try {
      const tmp = await fixtures.reset(data);

      if (tmp) {
        const {operation} = tmp;

        if (operation) {
          return await checkIntegrity(operation);
        }
      }

      await checkIntegrity();
    } catch (e) {
      log.dump({
        reset_error: e,
      });

      emit('setstate', {
        valid: false,
        invalidMsg: e.message,
      });
    }
  });

  socket.on('onDelete', async (id) => {
    try {
      const data = await mtree.treeDelete(id);

      await checkIntegrity();
    } catch (e) {
      log.dump({
        delete_error: e,
      });

      emit('setstate', {
        valid: false,
        invalidMsg: e.message,
      });
    }
  });

  socket.on('onAdd', async (data) => {
    const {title, targetId, method, n, extra = {}} = data;

    log.dump(
      {
        onAdd_params: data,
      },
      3
    );

    try {
      await knex().transaction(async (trx) => {
        const sourceId = await mtree.insert(trx, {
          title,
        });

        switch (method) {
          case 'treeCreateBefore':
          case 'treeCreateAfter':
            await mtree[method](trx, {
              sourceId,
              targetId,
            });
            break;
          case 'treeCreateAsNthChild':
            const params = {
              sourceId,
              parentId: targetId,
            };
            if (n) {
              params.nOneIndexed = n;
            }
            await mtree.treeCreateAsNthChild(trx, params);
            break;
          default:
            throw new Error(`Method unknown '${method}'`);
        }
      });

      log.dump('inserted');

      await checkIntegrity();
    } catch (e) {
      log.dump(
        {
          method,
          add_error: e,
        },
        6
      );

      emit('setstate', {
        valid: false,
        invalidMsg: e.message,
      });
    }
  });

  socket.on('onPaste', async (data) => {
    const {sourceId, targetId, method, n, extra = {}} = data;

    try {
      // await knex().transaction(async trx => {

      const trx = false;

      switch (method) {
        case 'treeMoveBefore':
        case 'treeMoveAfter':
          await mtree[method](trx, {
            sourceId,
            targetId,
            // strict: true,
          });
          break;
        case 'treeMoveToNthChild':
          const params = {
            sourceId,
            parentId: targetId,
            // gate: true,
            // strict: true,
          };

          if (n) {
            params.nOneIndexed = n;
          }

          await mtree.treeMoveToNthChild(trx, params);
          break;
        default:
          throw new Error(`Method unknown '${method}'`);
      }
      // });

      log.dump('inserted');

      await checkIntegrity();
    } catch (e) {
      log.dump(
        {
          method,
          add_error: e,
        },
        6
      );

      emit('setstate', {
        valid: false,
        invalidMsg: e.message,
      });
    }
  });

  socket.on('fix', async () => {
    try {
      await mtree.treeFix();

      await checkIntegrity();
    } catch (e) {
      log.dump({
        fix_error: e,
      });

      emit('setstate', {
        valid: false,
        invalidMsg: e.message,
      });
    }
  });

  socket.on('check', async () => {
    try {
      await checkIntegrity();
    } catch (e) {
      log.dump({
        check_error: e,
      });

      emit('setstate', {
        valid: false,
        invalidMsg: e.message,
      });
    }
  });

  (function () {
    const toYml = (function () {
      function level(data, operation) {
        if (isArray(data)) {
          return data.map((a) => level(a, operation));
        }

        if (isObject(data)) {
          const d = {};

          if (data.id === operation.sourceId) {
            d.operation = 'source';
          }

          if (data.id === operation.parentId) {
            d.operation = 'parent';
          }

          if (data.title) {
            d.title = data.title;
          }

          if (data.children) {
            d.children = level(data.children, operation);
          }

          return d;
        }

        return data;
      }

      return function (data, operation) {
        try {
          const yml = {
            operation,
            root: level(data.tree, operation)[0],
          };

          return safeDump(yml);
        } catch (e) {
          return `catch: toYaml: ` + (e + '');
        }
      };
    })();

    socket.on('start', async (on) => {
      // log.dump('start', on, ' wtf?');

      try {
        const man = knex().model.tree;

        await knex().transaction(async (trx) => {
          const source = await man.queryOne(
            trx,
            `SELECT * FROM :table: t WHERE t.tlevel > 1 ORDER BY rand() LIMIT 1 FOR UPDATE`
          );
          //                     const source = await man.queryOne(trx, `
          // (
          //     SELECT *, '1' origin
          //     FROM tree t
          //     WHERE
          // 	    (t.tr - t.tl < 2)
          // 	    AND (SELECT (tt.tr - tt.tl) diff FROM tree tt WHERE tt.tl = (t.tr + 1) FOR update) < 2
          // 	    AND (SELECT (ttt.tr - ttt.tl) diff FROM tree ttt WHERE ttt.tr = (t.tl - 1) FOR update) < 2
          //     ORDER BY rand()
          // )
          // UNION
          // (
          //     SELECT *, '2' origin FROM tree FOR update
          // )
          // ORDER BY origin, RAND()
          // LIMIT 1
          // `);

          if (!source) {
            return log.dump({
              start_error_l1: 'source not found',
            });
          }

          const logic = async () => {
            const countOnTheFirstLevel = await man.queryColumn(
              trx,
              `select count(*) from :table: t where t.tlevel = 2`
            );

            let target;

            if (countOnTheFirstLevel < 4) {
              target = await man.queryOne(trx, `select * from :table: t where t.tlevel = 1 limit 1 FOR UPDATE`);
            } else {
              target = await man.queryOne(
                trx,
                `select * FROM tree t where t.tlevel > 1 AND not (t.tl >= :l AND t.tr <= :r) ORDER BY RAND() LIMIT 1 FOR UPDATE`,
                {
                  l: source.tl,
                  r: source.tr,
                }
              );

              //                             target = await man.queryOne(trx, `
              // (
              // SELECT *, '1' origin
              // FROM tree t
              // where t.tlevel > 1
              // AND not (t.tl >= :l AND t.tr <= :r)
              // AND (t.tr - t.tl) < 2
              // ORDER BY RAND()
              // ) UNION (
              // SELECT *, '2' origin FROM tree ORDER BY RAND()
              // )
              // ORDER BY origin, RAND()
              // LIMIT 1
              // `, {
              //                                 l: source.tl,
              //                                 r: source.tr,
              //                             });
            }

            // log.dump({
            //     t: 'source',
            //     [source.tid]: source,
            // });

            if (!target) {
              return log.dump({
                start_error_l2: 'target not found',
              });
            }

            // log.dump({
            //     t: 'target',
            //     [target.tid]: target,
            // });

            const index = Math.random() < 0.15 ? 1000 : target.tsort;

            const operation = {
              sourceId: source.tid,
              // parentId    : target.tparent_id || 1,
              parentId: target.tid || 1,
              nOneIndexed: index,
            };

            console.log(
              `${(on + '').padStart(3, '0')}: source: ${operation.sourceId} parentId: ${operation.parentId} n: ${index}`
            );

            const snapshot = await mtree.treeCheckIntegrity(trx, 't.title');

            try {
              await man.treeMoveToNthChild(trx, operation);
            } catch (e) {
              // log.dump({
              //     e
              // })

              if ((e + '').indexOf(`already at the end because it's "last`) > -1) {
                // log.dump({soft_error: on + ': already last'});
              } else {
                throw e;
              }
            }

            const data = await mtree.treeCheckIntegrity(trx, 't.title');

            const {tree, valid, invalidMsg} = data;

            let invalid = false;

            if (!valid) {
              invalid = {
                snapshot: toYml(snapshot, operation),
                s: snapshot,
                operation,
              };
            }

            const enriched = enrich(JSON.parse(JSON.stringify(data.tree)));

            const checked = JSON.parse(JSON.stringify(enriched));

            check(checked, 1, '', false, 1, operation);

            setTimeout(
              () =>
                emit('flood', {
                  old: data,
                  checked,
                  invalid,
                  on,
                }),
              0
            ); /* delay */
          };

          let i = 1;
          while (i < 5) {
            try {
              await logic();

              break;
            } catch (e) {
              if ((e + '').indexOf('move element as a child of the same paren') > -1) {
                // console.log(`move element as a child of the same paren in ${i} attempt, let's repeat logic`);
              } else {
                throw e;
              }
            }

            i += 1;
          }
        });
      } catch (e) {
        // log.dump({
        //     start_error: e,
        // })
      }
    });
  })();
});

server.listen(
  // ... we have to listen on server
  port,
  host,
  undefined, // io -- this extra parameter
  () => {
    console.log(`\n 🌎  Server is running ${host}:${port}` + '\n');
  }
);
