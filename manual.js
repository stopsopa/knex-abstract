
const path              = require('path');

const fs                = require('fs');

const log               = require('inspc');

const express           = require('express');

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

    const refresh = () => {

        emit('refresh', {
            data: 'data'
        })
    };

    console.log('connect..');

    socket.on('reset', () => {
        fixtures.reset();
    })

    socket.on('fix', async () => {

        try {

            const fix   = await knex().model.tree.treeFix();

            const data  = await knex().model.tree.treeCheckIntegrity('t.title');

            emit('tobrowser', data);
        }
        catch (e) {

            log.dump({
                check_error: e
            })
        }

    });

    socket.on('check', async () => {

        try {

            const data = await knex().model.tree.treeCheckIntegrity('t.title');

            emit('tobrowser', data) ;
        }
        catch (e) {

            log.dump({
                check_error: e
            })
        }

    });

    socket.on('gimi', () => {

        console.log('gimi came');

        // iolog('data', {
        //     event: `init`,
        //     inspect: cache.inspect(),
        //     lastInfo: cache.lastInfo(),
        // })
    })
});

server.listen( // ... we have to listen on server
    port,
    host,
    undefined, // io -- this extra parameter
    () => {

        console.log(`\n 🌎  Server is running ${host}:${port}` + "\n")
    }
);