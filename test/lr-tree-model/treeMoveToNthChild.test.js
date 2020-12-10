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

const prepare = async (file = 'tree-fixture-test-set-3') => {

    const fixtures = fixturesTool({
        yamlFile: path.resolve(__dirname, `${file}.yml`),
        knex,
    });

    await fixtures.reset();
}

it('nestedset - treeMoveToNthChild last', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(90);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        await mtree.treeMoveToNthChild({
            sourceId: 23,
            parentId: 19,
            strict: true,
        });
    }
    catch (e) {

        expect(String(e)).toEqual(`Error: nestedset.js: treeMoveToNthChild: can't move last element to the end, because it's already at the end because it's "last"`);

        done();
    }
});


it('nestedset - treeMoveToNthChild same-index', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(90);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        await mtree.treeMoveToNthChild({
            sourceId: 19,
            parentId: 16,
            nOneIndexed: 3,
            strict: true,
        });
    }
    catch (e) {

        expect(String(e)).toEqual(`Error: nestedset.js: treeMoveToNthChild: can't move element as a child of the same parent '16' and to the same index '3'`);

        done();
    }
});

it('nestedset - treeMoveToNthChild child of itself', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(90);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        await mtree.treeMoveToNthChild({
            sourceId: 16,
            parentId: 19,
            // nOneIndexed: 3,
            strict: true,
        });
    }
    catch (e) {

        expect(String(e)).toEqual(`Error: nestedset.js: treeMoveToNthChild: #8 can't move element as a child of itself`);

        done();
    }
});
