
const path              = require('path');

const fs                = require('fs');

const log               = require('inspc');

const express           = require('express');

const isObject          = require('nlab/isObject');

const isArray           = require('nlab/isArray');

require('dotenv-up')({
    override    : false,
    deep        : 1,
}, true, 'manual');

const fixturesTool          = require('./test/lr-tree-model/tree-fixtures');

const host              = process.env.HOST;

const port              = process.env.PORT;

const { Router }        = express;

const app               = express();

const server            = require('http').createServer(app);

const io                = require('socket.io')(server); // io

app.use(express.static('.'));

app.use(express.urlencoded({extended: false}));

app.use(express.json());

const knex              = require('./src');

knex.init(require('./test/lr-tree-model/config'));

const fixtures = fixturesTool({
    // yamlFile: path.resolve(__dirname, './test/lr-tree-model/tree-fixture-sm.yml'),
    yamlFile: path.resolve(__dirname, './test/lr-tree-model/tree-fixture-big.yml'),
    knex,
});

const emit = require('./test/lr-tree-model/io')({
    io,
});

io.on('connection', socket => {

    const mtree = knex().model.tree;

    function enrich(data) {

        if (isArray(data)) {

            return data.map(a => enrich(a));
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
            }
        }

        return data;
    }

    function check(list, k = 1, p = '', pid = false, level = 1) {

        if (Array.isArray(list)) {

            let ii = 0;
            for (let i = 0, l = list.length, t, key; i < l ; i += 1 ) {

                t = list[i];

                let wrong = ! (t.sort.d > 0);

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

                    k = check(t.children, k, key, t.id.d, level + 1);
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

        return async () => {

            const data  = await mtree.treeCheckIntegrity('t.title');

            const enriched = enrich(JSON.parse(JSON.stringify(data.tree)));

            const checked   = JSON.parse(JSON.stringify(enriched));

            check(checked);

            emit('tobrowser', {
                old: data,
                checked,
            });
        };
    }());

    console.log('connect..');

    socket.on('reset', async () => {

        try {

            await fixtures.reset();

            await checkIntegrity();
        }
        catch (e) {

            log.dump({
                reset_error: e
            })

            emit('setstate', {
                valid: false,
                invalidMsg: e.message,
            });
        }
    })

    socket.on('onDelete', async id => {

        try {

            const data = await mtree.treeDelete(id);

            await checkIntegrity();
        }
        catch (e) {

            log.dump({
                delete_error: e
            })

            emit('setstate', {
                valid: false,
                invalidMsg: e.message,
            });
        }
    })

    socket.on('onAdd', async (data) => {

        const {
            title,
            targetId,
            method,
            n,
            extra = {}
        } = data;

        log.dump({
            onAdd_params: data,
        }, 3)

        try {

            await knex().transaction(async trx => {

                const sourceId = await mtree.insert(trx, {
                    title,
                });

                switch(method) {
                    case 'before':
                        await mtree.treeCreateBefore(trx, {
                            sourceId,
                            targetId,
                        });
                        break;
                    case 'after':
                        await mtree.treeCreateAfter(trx, {
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
        }
        catch (e) {

            log.dump({
                method,
                add_error: e
            }, 6)

            emit('setstate', {
                valid: false,
                invalidMsg: e.message,
            });
        }
    })

    socket.on('onPaste', async (data) => {

        const {
            sourceId,
            targetId,
            method,
            n,
            extra = {}
        } = data;

        log.dump({
            onPaste_params: data,
        }, 3);

        try {

            // await knex().transaction(async trx => {

                const trx = false;

                switch(method) {
                    case 'before':
                        await mtree.treeCreateBefore(trx, {
                            sourceId,
                            targetId,
                        });
                        break;
                    case 'after':
                        await mtree.treeCreateAfter(trx, {
                            sourceId,
                            targetId,
                        });
                        break;
                    case 'treeMoveToNthChild':
                        const params = {
                            sourceId,
                            parentId: targetId,
                            // gate: true,
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
        }
        catch (e) {

            log.dump({
                method,
                add_error: e
            }, 6)

            emit('setstate', {
                valid: false,
                invalidMsg: e.message,
            });
        }
    })

    socket.on('fix', async () => {

        try {

            await mtree.treeFix();

            await checkIntegrity();
        }
        catch (e) {

            log.dump({
                fix_error: e
            })

            emit('setstate', {
                valid: false,
                invalidMsg: e.message,
            });
        }
    });

    socket.on('check', async () => {

        try {

            await checkIntegrity();
        }
        catch (e) {

            log.dump({
                check_error: e
            })

            emit('setstate', {
                valid: false,
                invalidMsg: e.message,
            });
        }
    });
});

server.listen( // ... we have to listen on server
    port,
    host,
    undefined, // io -- this extra parameter
    () => {

        console.log(`\n 🌎  Server is running ${host}:${port}` + "\n")
    }
);