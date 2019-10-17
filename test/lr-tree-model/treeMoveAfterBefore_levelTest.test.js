'use strict';

const path              = require('path');

const log               = require('inspc');

const knex              = require('knex-abstract');

require('dotenv-up')(4, false, 'tests');

const fixturesTool      = require('./tree-fixtures');

const config            = require('./config');

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

const prepare = async (file = 'tree-fixture-test-set-5') => {

    const fixtures = fixturesTool({
        yamlFile: path.resolve(__dirname, `${file}.yml`),
        knex,
    });

    await fixtures.reset();
}

it('nestedset - treeMoveAfter the same level', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {
        let sourceId = 32,
            targetId = 34;
        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();
        expect(tmp.valid).toBeTruthy();

    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 32,
            "title": "r1 a3",
            "tl": 65,
            "tlevel": 3,
            "tparent_id": 2,
            "tr": 66,
            "tsort": 5,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveBefore the same level', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {
        let sourceId = 35,
            targetId = 34;
        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();
        expect(tmp.valid).toBeTruthy();

    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual( {
            "tid": 35,
            "title": "r1 a6",
            "tl": 65,
            "tlevel": 3,
            "tparent_id": 2,
            "tr": 66,
            "tsort": 5,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveAfter with childen diferent level', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {
        let sourceId = 3,
            targetId = 27;
        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();
        expect(tmp.valid).toBeTruthy();

    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 3,
            "title": "r1 a1",
            "tl": 20,
            "tlevel": 4,
            "tparent_id": 19,
            "tr": 51,
            "tsort": 9,
        });
        expect(await mtree.count()).toEqual(72);
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveBefore with childen diferent level', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {
        let sourceId = 37,
            targetId = 4;
        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();
        expect(tmp.valid).toBeTruthy();

    
        const { created, updated, ...entity } = await mtree.find(sourceId);        
        expect(entity).toEqual({
            "tid": 37,
            "title": "r2 a1",
            "tl": 4,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 49,
            "tsort": 1,
        }); 
        expect(await mtree.count()).toEqual(72);
        done();
    }
    catch (e) {
            
    }
});