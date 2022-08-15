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

it("nestedset - integrity after #4", (done) => {
  (async function () {
    await test({
      sourceId: 32,
      parentId: 16,
      nOneIndexed: 3,
      nodes: 90,
      after: {
        tid: 32,
        title: "r1 a1 b9",
        tl: 33,
        tlevel: 5,
        tparent_id: 16,
        tr: 44,
        tsort: 3,
      },
    });

    done();
  })();
});

it("nestedset - integrity after #4 1", (done) => {
  (async function () {
    await test({
      sourceId: 38,
      parentId: 21,
      // nOneIndexed : 3,
      nodes: 90,
      after: {
        tid: 38,
        title: "r1 a1 b10",
        tl: 39,
        tlevel: 7,
        tparent_id: 21,
        tr: 40,
        tsort: 2,
      },
    });

    done();
  })();
});

it("nestedset - integrity after #4 2", (done) => {
  (async function () {
    await test({
      sourceId: 32,
      parentId: 21,
      nOneIndexed: 1,
      nodes: 90,
      after: {
        tid: 32,
        title: "r1 a1 b9",
        tl: 37,
        tlevel: 7,
        tparent_id: 21,
        tr: 48,
        tsort: 1,
      },
    });

    done();
  })();
});
