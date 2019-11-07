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


it('nestedset - treeMoveAfter the same level, move up, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 4,
            targetId = 14;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 4,
            "title": "r1 a1 b1",
            "tl": 26,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 27,
            "tsort": 6,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveAfter the same level, move down, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 13,
            targetId = 4;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 13,
            "title": "r1 a1 b5",
            "tl": 6,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 7,
            "tsort": 2,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveAfter the same level, move up, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 5,
            targetId = 14;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 5,
            "title": "r1 a1 b2",
            "tl": 18,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 27,
            "tsort": 6,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveAfter the same level, move down, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 14,
            targetId = 4;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 14,
            "title": "r1 a1 b6",
            "tl": 6,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 9,
            "tsort": 2,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

 

it('nestedset - treeMoveAfter different level, move up, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 38,
            targetId = 48;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 38,
            "title": "r2 a1 b1",
            "tl": 91,
            "tlevel": 5,
            "tparent_id": 43,
            "tr": 92,
            "tsort": 6,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveAfter different level, move down, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 44,
            targetId = 38;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 44,
            "title": "r2 a1 b6 c1",
            "tl": 74,
            "tlevel": 4,
            "tparent_id": 37,
            "tr": 75,
            "tsort": 2,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveAfter different level, move up, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 43,
            targetId = 53;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 43,
            "title": "r2 a1 b6",
            "tl": 91,
            "tlevel": 5,
            "tparent_id": 51,
            "tr": 102,
            "tsort": 3,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveAfter different level, move down, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 16,
            targetId = 3;

        await mtree.treeMoveAfter({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 16,
            "title": "r1 a1 b9",
            "tl": 31,
            "tlevel": 3,
            "tparent_id": 2,
            "tr": 34,
            "tsort": 2,
        });

        expect(await mtree.count()).toEqual(72);

        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveBefore the same level, move up, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 20,
            targetId = 31;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 20,
            "title": "r1 a2 b1",
            "tl": 56,
            "tlevel": 4,
            "tparent_id": 19,
            "tr": 57,
            "tsort": 11,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveBefore the same level, move down, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 31,
            targetId = 20;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 31,
            "title": "r1 a2 b12",
            "tl": 36,
            "tlevel": 4,
            "tparent_id": 19,
            "tr": 37,
            "tsort": 1,
        });

        expect(await mtree.count()).toEqual(72);

        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveBefore the same level, move up, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 5,
            targetId = 18;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 5,
            "title": "r1 a1 b2",
            "tl": 22,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 31,
            "tsort": 7,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveBefore the same level, move down, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 14,
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
            "tid": 14,
            "title": "r1 a1 b6",
            "tl": 4,
            "tlevel": 4,
            "tparent_id": 3,
            "tr": 7,
            "tsort": 1,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

 

it('nestedset - treeMoveBefore different level, move up, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 38,
            targetId = 44;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 38,
            "title": "r2 a1 b1",
            "tl": 81,
            "tlevel": 5,
            "tparent_id": 43,
            "tr": 82,
            "tsort": 1,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveBefore different level, move down, without children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 44,
            targetId = 38;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 44,
            "title": "r2 a1 b6 c1",
            "tl": 72,
            "tlevel": 4,
            "tparent_id": 37,
            "tr": 73,
            "tsort": 1,
        });

        expect(await mtree.count()).toEqual(72);
        
        done();
    }
    catch (e) {
            
    }
});


it('nestedset - treeMoveBefore different level, move up, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 43,
            targetId = 52;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 43,
            "title": "r2 a1 b6",
            "tl": 87,
            "tlevel": 5,
            "tparent_id": 51,
            "tr": 98,
            "tsort": 1,
        });

        expect(await mtree.count()).toEqual(72);

        done();
    }
    catch (e) {
            
    }
});

it('nestedset - treeMoveBefore different level, move down, with children', async done => {

    await prepare();

    expect(await mtree.count()).toEqual(72);

    let tmp = await mtree.treeCheckIntegrity();

    expect(tmp.valid).toBeTruthy();

    try {

        let sourceId = 16,
            targetId = 3;

        await mtree.treeMoveBefore({
            sourceId,
            targetId,
            strict: true,
        });

        tmp = await mtree.treeCheckIntegrity();

        expect(tmp.valid).toBeTruthy();
    
        const { created, updated, ...entity } = await mtree.find(sourceId);

        expect(entity).toEqual({
            "tid": 16,
            "title": "r1 a1 b9",
            "tl": 3,
            "tlevel": 3,
            "tparent_id": 2,
            "tr": 6,
            "tsort": 1,
        });

        expect(await mtree.count()).toEqual(72);

        done();
    }
    catch (e) {
            
    }
});