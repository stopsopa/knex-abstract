"use strict";

const path = require("path");

const log = require("inspc");

const knex = require('knex-abstract');

require("dotenv-up")(4, false, "tests");

const fixturesTool = require("./tree-fixtures");

const config = require("../lr-tree-model/config");

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

const prepare = async (file = "tree-fixture-test-set-2") => {
  const fixtures = fixturesTool({
    yamlFile: path.resolve(__dirname, `${file}.yml`),
    knex,
  });

  await fixtures.reset();
};

const test = async (opt, equal) => {
  let tmp;

  try {
    await prepare();

    expect(await mtree.count({})).toEqual(85);

    tmp = await mtree.treeCheckIntegrity({});

    expect(tmp.valid).toBeTruthy();

    await mtree.treeMoveToNthChild(
      {},
      {
        ...opt,
        gate: true,
        strict: true,
      }
    );
  } catch (e) {
    return expect(e.message).toEqual(equal);
  }

  throw new Error(
    "Gate test failed, params: " +
      JSON.stringify(
        {
          opt,
          equal,
        },
        null,
        4
      )
  );
};

it("nestedset - treeMoveToNthChild #1 mid", (done) => {
  (async function () {
    await test(
      {
        sourceId: 12,
        parentId: 3,
        nOneIndexed: 11,
      },
      "#1"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #1 last (implicit)", (done) => {
  (async function () {
    await test(
      {
        sourceId: 12,
        parentId: 3,
        // nOneIndexed : 11,
      },
      "#1"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #1 last (explicit)", (done) => {
  (async function () {
    await test(
      {
        sourceId: 12,
        parentId: 3,
        nOneIndexed: 12,
      },
      "#1"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #1 last (beyond range)", (done) => {
  (async function () {
    await test(
      {
        sourceId: 12,
        parentId: 3,
        nOneIndexed: 120,
      },
      "#1"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #same-index", (done) => {
  (async function () {
    await test(
      {
        sourceId: 5,
        parentId: 3,
        nOneIndexed: 2,
      },
      "#same-index"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #2 regular", (done) => {
  (async function () {
    await test(
      {
        sourceId: 12,
        parentId: 3,
        nOneIndexed: 2,
      },
      "#2"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #2", (done) => {
  (async function () {
    await test(
      {
        sourceId: 35,
        parentId: 3,
        nOneIndexed: 1,
      },
      "#2"
    );

    done();
  })();
});

it("nestedset - treeMoveToNthChild #2 - minus", (done) => {
  (async function () {
    await test(
      {
        sourceId: 35,
        parentId: 3,
        nOneIndexed: -10,
      },
      "#2"
    );

    done();
  })();
});
