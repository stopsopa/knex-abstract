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

it('lrtree - treeDelete 74', async done => {

    let tmp;

    try {

        await prepare();

        expect(await mtree.count()).toEqual(75);

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();

        await mtree.treeDelete(57);

        expect(await mtree.count()).toEqual(74);

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();

        done();
    }
    catch (e) {

        log.dump(e, 5);

        throw e;
    }
});

it('lrtree - treeDelete 9', async done => {

    let tmp;

    await prepare();

    expect(await mtree.count()).toEqual(75);

    tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    await knex().transaction(async trx => {

        await mtree.treeDelete(trx, 9);

        expect(await mtree.count(trx)).toEqual(69);

        tmp = await mtree.treeCheckIntegrity(trx);

        expect(tmp.valid).toBeTruthy();
    });

    done();
});
