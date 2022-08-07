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

const prepare = async (file = 'tree-fixture-test-set-1') => {

    const fixtures = fixturesTool({
        yamlFile: path.resolve(__dirname, `${file}.yml`),
        knex,
    });

    await fixtures.reset();
}

it('nestedset - treeCreateAfter 76', done => {

  (async function () {

    let tmp;

    try {

        await prepare();

        expect(await mtree.count({})).toEqual(75);

        tmp = await mtree.treeCheckIntegrity({});

        expect(tmp.valid).toBeTruthy();

        const id = await mtree.insert({}, {
            title: 'test',
        });

        await mtree.treeCreateAfter({}, {
            sourceId: id, targetId: 12,
            strict: true,
        });

        expect(await mtree.count({})).toEqual(76);

        tmp = await mtree.treeCheckIntegrity({});

        expect(tmp.valid).toBeTruthy();

        const { created, updated, ...entity } = await mtree.find({}, id);

        expect(entity).toEqual({
            "tid": 76,
            "title": "test",
            "tl": 21,
            "tlevel": 5,
            "tparent_id": 9,
            "tr": 22,
            "tsort": 4,
        });

        done();
    }
    catch (e) {

        log.dump(e, 5);

        throw e;
    }
  }())
});

it('nestedset - treeCreateAfter 9', done => {

  (async function () {

    let tmp;

    try {

        await prepare();

        expect(await mtree.count({})).toEqual(75);

        tmp = await mtree.treeCheckIntegrity({});

        expect(tmp.valid).toBeTruthy();

        await knex().transaction(async trx => {

            const id = await mtree.insert({trx}, {
                title: 'test',
            });

            await mtree.treeCreateAfter({trx}, {
                sourceId: id,
                targetId: 12,
                strict: true,
            });

            expect(await mtree.count({trx})).toEqual(76);

            tmp = await mtree.treeCheckIntegrity({trx});

            expect(tmp.valid).toBeTruthy();

            const { created, updated, ...entity } = await mtree.find({trx}, id);

            expect(entity).toEqual({
                "tid": 76,
                "title": "test",
                "tl": 21,
                "tlevel": 5,
                "tparent_id": 9,
                "tr": 22,
                "tsort": 4,
            });
        });

        done();
    }
    catch (e) {

        log.dump(e, 5);

        throw e;
    }
  }())
});

