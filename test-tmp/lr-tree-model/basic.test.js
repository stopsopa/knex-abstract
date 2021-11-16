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

const prepare = async (file = "tree-fixture-test-set-1") => {
  const fixtures = fixturesTool({
    yamlFile: path.resolve(__dirname, `${file}.yml`),
    knex,
  });

  await fixtures.reset();
};

it("nestedset - basic", (done) => {
  (async function () {
    try {
      await prepare();

      const c = await mtree.count();

      expect(c).toEqual(75);

      done();
    } catch (e) {
      log.dump(e);

      throw e;
    }
  })();
});

it("nestedset - fix", (done) => {
  (async function () {
    try {
      await prepare();

      const register = {};

      await mtree.update(
        {
          tr: 100,
        },
        19
      );

      const row = await mtree.queryOne(
        `select * from :table: where :id: = :id`,
        {
          id: 19,
        }
      );

      const { created, updated, ...rest } = row;

      expect(rest).toEqual({
        tid: 19,
        tl: 33,
        tlevel: 5,
        tparent_id: 17,
        tr: 100,
        tsort: 2,
        title: "r1 a1 b9 c2",
      });

      try {
        const { valid, invalidMsg } = await mtree.treeCheckIntegrity();

        expect({ valid, invalidMsg }).toEqual({
          valid: false,
          invalidMsg:
            "LRTree integrity error: Node id: '19' key: 'tr' should have value '34', found '100', path to node '1.2.3.17.19'",
        });

        register.check_try = true;
      } catch (e) {
        register.check_fail = e.message;
      }

      await mtree.treeFix();

      try {
        const { valid, invalidMsg } = await mtree.treeCheckIntegrity();

        expect({ valid, invalidMsg }).toEqual({
          valid: true,
          invalidMsg: undefined,
        });

        register.check_try2 = true;
      } catch (e) {
        register.check_fail2 = e.message;
      }

      expect(register).toEqual({
        check_try: true,
        check_try2: true,
      });

      done();
    } catch (e) {
      log.dump(
        {
          test_fix_error: e,
        },
        5
      );

      throw e;
    }
  })();
});
