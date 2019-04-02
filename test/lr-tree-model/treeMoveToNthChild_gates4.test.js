'use strict';

const path              = require('path');

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(4, false, 'tests');

const fixturesTool      = require('./tree-fixtures');

const config            = require('../lr-tree-model/config');

knex.init(config);

let man;

let mtree;

beforeAll(async () => {

    man     = knex().model.users;

    mtree   = knex().model.tree;
});

afterAll(async () => {

    // await clear();

    await man.destroy();
});

const prepare = async (file = 'tree-fixture-test-set-2') => {

    const fixtures = fixturesTool({
        yamlFile: path.resolve(__dirname, `${file}.yml`),
        knex,
    });

    await fixtures.reset();
}

const test = async (opt, equal) => {

    let tmp;

    try {

        await prepare();

        expect(await mtree.count()).toEqual(85);

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();

        await mtree.treeMoveToNthChild({
            ...opt,
            gate        : true,
        });
    }
    catch (e) {

        return expect(e.message).toEqual(equal);
    }

    throw new Error('Gate test failed, params: ' + JSON.stringify({
        opt,
        equal,
    }, null, 4));
}

it('nestedset - treeMoveToNthChild #5', async done => {

    await test({
        sourceId    : 30,
        parentId    : 3,
        nOneIndexed : 2,
    }, '#5');

    done()
});

it('nestedset - treeMoveToNthChild #5 2', async done => {

    await test({
        sourceId    : 23,
        parentId    : 3,
        nOneIndexed : 2,
    }, '#5');

    done()
});


it('nestedset - treeMoveToNthChild #5 3', async done => {

    await test({
        sourceId    : 24,
        parentId    : 3,
        nOneIndexed : 2,
    }, '#5');

    done()
});

it('nestedset - treeMoveToNthChild #5 4', async done => {

    await test({
        sourceId    : 15,
        parentId    : 3,
        nOneIndexed : 2,
    }, '#5');

    done()
});

it('nestedset - treeMoveToNthChild #5 5', async done => {

    await test({
        sourceId    : 23,
        parentId    : 1,
        nOneIndexed : 2,
    }, '#5');

    done()
});


it('nestedset - treeMoveToNthChild #5 6', async done => {

    await test({
        sourceId    : 23,
        parentId    : 1,
        // nOneIndexed : 2,
    }, '#5');

    done()
});

