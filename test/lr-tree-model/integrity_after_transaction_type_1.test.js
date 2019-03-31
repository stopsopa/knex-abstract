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

const test = async params => {

    const {
        nodes,
        after,
        ...opt,
    } = params;

    await prepare();

    expect(await mtree.count()).toEqual(nodes);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    await mtree.treeMoveToNthChild(opt);

    tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    const { created, updated, ...entity } = await mtree.find(opt.sourceId);

    expect(entity).toEqual(after);

    await prepare();

    await knex().transaction(async trx => {

        expect(await mtree.count(trx)).toEqual(nodes);

        let tmp = await mtree.treeCheckIntegrity(trx);

        expect(tmp.valid).toBeTruthy();

        await mtree.treeMoveToNthChild(trx, opt);

        tmp = await mtree.treeCheckIntegrity(trx);

        expect(tmp.valid).toBeTruthy();

        const { created, updated, ...entity } = await mtree.find(trx, opt.sourceId);

        expect(entity).toEqual(after);

    });
}

it('lrtree - integrity after #1', async done => {

    await test({
        sourceId    : 5,
        parentId    : 3,
        // nOneIndexed : 2,
        nodes       : 90,
        after: {
            "tid": 5,
            "title": "r1 a1 b2",
            "tl": 68,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 77,
            "tsort": 12
        }
    });

    done()
});

it('lrtree - integrity after #1 1', async done => {

    await test({
        sourceId    : 15,
        parentId    : 3,
        nOneIndexed : 11,
        nodes       : 90,
        after: {
            "tid": 15,
            "title": "r1 a1 b5",
            "tl": 74,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 75,
            "tsort": 11
        }
    });

    done()
});
