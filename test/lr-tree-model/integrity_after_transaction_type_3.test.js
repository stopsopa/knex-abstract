"use strict";

const path = require("path");

const log = require("inspc");

const knex = require("../../src");

require("dotenv-up")(4, false, "tests");

const fixturesTool = require("./tree-fixtures");

const config = require("./config");

knex.init(config);

let man;

let mtree;

beforeAll(async () => {
  man = knex().model.users;

  mtree = knex().model.tree;
});

afterAll(async () => {
  // await clear();

  await man.destroy();
});

const prepare = async (file = "tree-fixture-test-set-3") => {
  const fixtures = fixturesTool({
    yamlFile: path.resolve(__dirname, `${file}.yml`),
    knex,
  });

  await fixtures.reset();
};

const test = async (params) => {
  let { nodes, after, ...opt2 } = params;

  opt2 = {
    ...opt2,
    strict: true,
  };

  await prepare();

  expect(await mtree.count({})).toEqual(nodes);

  let tmp = await mtree.treeCheckIntegrity({});

  expect(tmp.valid).toBeTruthy();

  await mtree.treeMoveToNthChild({}, opt2);

  tmp = await mtree.treeCheckIntegrity({});

  expect(tmp.valid).toBeTruthy();

  const { created, updated, ...entity } = await mtree.find({}, opt2.sourceId);

  expect(entity).toEqual(after);

  await prepare();

  await knex().transaction(async (trx) => {
    expect(await mtree.count({ trx })).toEqual(nodes);

    let tmp = await mtree.treeCheckIntegrity({ trx });

    expect(tmp.valid).toBeTruthy();

    await mtree.treeMoveToNthChild({ trx }, opt2);

    tmp = await mtree.treeCheckIntegrity({ trx });

    expect(tmp.valid).toBeTruthy();

    const { created, updated, ...entity } = await mtree.find({ trx }, opt2.sourceId);

    expect(entity).toEqual(after);
  });
};

it("nestedset - integrity after #3", (done) => {
  (async function () {
    await test({
      sourceId: 5,
      parentId: 10,
      nOneIndexed: 2,
      nodes: 90,
      after: {
        tid: 5,
        title: "r1 a1 b2",
        tl: 9,
        tlevel: 5,
        tparent_id: 10,
        tr: 18,
        tsort: 2,
      },
    });

    done();
  })();
});

it("nestedset - integrity after #3 1", (done) => {
  (async function () {
    await test({
      sourceId: 5,
      parentId: 21,
      // nOneIndexed : 2,
      nodes: 90,
      after: {
        tid: 5,
        title: "r1 a1 b2",
        tl: 29,
        tlevel: 7,
        tparent_id: 21,
        tr: 38,
        tsort: 2,
      },
    });

    done();
  })();
});

it("nestedset - integrity after #3 2", (done) => {
  (async function () {
    await test({
      sourceId: 17,
      parentId: 19,
      // nOneIndexed : 2,
      nodes: 90,
      after: {
        tid: 17,
        title: "r1 a1 b6 c1",
        tl: 40,
        tlevel: 6,
        tparent_id: 19,
        tr: 41,
        tsort: 4,
      },
    });

    done();
  })();
});

it("nestedset - integrity after #3 2", (done) => {
  (async function () {
    await test({
      sourceId: 17,
      parentId: 19,
      nOneIndexed: 2,
      nodes: 90,
      after: {
        tid: 17,
        title: "r1 a1 b6 c1",
        tl: 34,
        tlevel: 6,
        tparent_id: 19,
        tr: 35,
        tsort: 2,
      },
    });

    done();
  })();
});
