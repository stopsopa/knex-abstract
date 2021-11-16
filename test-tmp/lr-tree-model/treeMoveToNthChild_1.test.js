"use strict";

const path = require("path");

const log = require("inspc");

const knex = require("knex-abstract");

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

const prepare = async (file = "tree-fixture-test-set-2") => {
  const fixtures = fixturesTool({
    yamlFile: path.resolve(__dirname, `${file}.yml`),
    knex,
  });

  await fixtures.reset();
};

it("nestedset - treeMoveToNthChild 76", (done) => {
  (async function () {
    let tmp;

    try {
      await prepare();

      expect(await mtree.count()).toEqual(85);

      tmp = await mtree.treeCheckIntegrity();

      expect(tmp.valid).toBeTruthy();

      await mtree.treeMoveToNthChild({
        sourceId: 12,
        parentId: 3,
        nOneIndexed: 11,
        strict: true,
      });

      expect(await mtree.count()).toEqual(85);

      tmp = await mtree.treeCheckIntegrity();

      expect(tmp.valid).toBeTruthy();

      const { created, updated, ...entity } = await mtree.find(12);

      expect(entity).toEqual({
        tid: 12,
        title: "r1 a1 b6",
        tl: 40,
        tlevel: 4,
        tparent_id: 3,
        tr: 65,
        tsort: 11,
      });

      done();
    } catch (e) {
      log.dump(e, 5);

      throw e;
    }
  })();
});

it("nestedset - treeMoveToNthChild 9", (done) => {
  (async function () {
    let tmp;

    try {
      await prepare();

      expect(await mtree.count()).toEqual(85);

      tmp = await mtree.treeCheckIntegrity();

      expect(tmp.valid).toBeTruthy();

      await knex().transaction(async (trx) => {
        await mtree.treeMoveToNthChild(trx, {
          sourceId: 12,
          parentId: 3,
          nOneIndexed: 11,
          strict: true,
        });

        expect(await mtree.count(trx)).toEqual(85);

        tmp = await mtree.treeCheckIntegrity(trx);

        expect(tmp.valid).toBeTruthy();

        const { created, updated, ...entity } = await mtree.find(trx, 12);

        expect(entity).toEqual({
          tid: 12,
          title: "r1 a1 b6",
          tl: 40,
          tlevel: 4,
          tparent_id: 3,
          tr: 65,
          tsort: 11,
        });
      });

      done();
    } catch (e) {
      log.dump(e, 5);

      throw e;
    }
  })();
});
