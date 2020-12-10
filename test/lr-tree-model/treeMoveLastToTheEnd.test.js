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

const prepare = async (file = 'tree-fixture-test-set-4') => {

    const fixtures = fixturesTool({
        yamlFile: path.resolve(__dirname, `${file}.yml`),
        knex,
    });

    await fixtures.reset();
}

it('move last to the end - throw', async done => {

    let tmp;

    try {

        await prepare();

        expect(await mtree.count()).toEqual(68);

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();

            await mtree.treeMoveToNthChild({
                sourceId: 15, parentId: 14,
                strict: true,
            });

    }
    catch (e) {

        expect(String(e)).toEqual(`Error: nestedset.js: treeMoveToNthChild: can't move last element to the end, because it's already at the end because it's "last"`);

        done();
    }
});

it('move last to the end', async done => {

    let tmp;

    try {

        await prepare();

        expect(await mtree.count()).toEqual(68);

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();

        try {

        }
        catch (e) {

        }

        await mtree.treeMoveToNthChild({
            sourceId: 15, parentId: 16,
            strict: true,
        });

        expect(await mtree.count()).toEqual(68);

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();

        {
            const { created, updated, ...entity } = await mtree.find(15);

            expect(entity).toEqual({
                "tid": 15,
                "title": "r1 a1 b6 c1",
                "tl": 29,
                "tlevel": 5,
                "tparent_id": 16,
                "tr": 30,
                "tsort": 2,
            });
        }

        {
            const { created, updated, ...entity } = await mtree.find(16);
            
            expect(entity).toEqual({
                "tid": 16,
                "title": "r1 a1 b9",
                "tl": 26,
                "tlevel": 4,
                "tparent_id": 3,
                "tr": 31,
                "tsort": 7,
            });
        }

        done();
    }
    catch (e) {

        log.dump(e, 5);

        throw e;
    }
});






