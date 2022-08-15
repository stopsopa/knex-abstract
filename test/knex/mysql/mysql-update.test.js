"use strict";

const log = require("inspc");

const knex = require('knex-abstract');

const delay = require("nlab/delay");

require("dotenv-up")(4, false, "tests");

const config = require("../../../models/config");

knex.init(config);

let man;

let manc;

let manm;

beforeAll(async () => {
  manc = knex().model.common;

  man = knex().model.users;

  manm = knex().model.many;

  await clear();
});

afterAll(async () => {
  await clear();

  await man.destroy();
});

const clear = async () => {
  await manc.raw({}, `truncate many`);
};

beforeEach(clear);

it(`knex - mysql - update`, (done) => {
  (async function () {
    await manm.insert(
      {},
      {
        title: "test",
      }
    );

    const affectedRows = await manm.update(
      {},
      {
        title: "test2",
      },
      {
        title: "test",
      }
    );

    expect(affectedRows).toEqual(1);

    const all = await manm.findAll({});

    expect(all).toEqual([{ id: 1, title: "test2", user_id: null }]);

    done();
  })();
});

// it(`knex - mysql - update, id`, async done => {
//
//     await manm.insert({}, {
//         title: 'test'
//     });
//
//     const affectedRows = await manm.update({}, {
//         title: 'test2'
//     }, 1);
//
//     expect(affectedRows).toEqual(1);
//
//     const all = await manm.findAll({});
//
//     expect(all).toEqual([{"id": 1, "title": "test2", "user_id": null}]);
//
//     done();
// });
//
//
// it(`knex - mysql - update, hasOwnProperty`, async done => {
//
//     await manm.insert({}, {
//         title: 'test'
//     });
//
//     const a = function () {};
//     a.prototype.other = 'other';
//
//     const b = function (t) { this.title = t };
//
//     b.prototype = Object.create(a.prototype);
//
//     b.prototype.constructor = b;
//
//     const c = new b('test2');
//
//     const affectedRows = await manm.update({}, c, 1);
//
//     expect(affectedRows).toEqual(1);
//
//     const all = await manm.findAll({});
//
//     expect(all).toEqual([{"id": 1, "title": "test2", "user_id": null}]);
//
//     done();
// });
//
//
// it(`knex - mysql - update, hasOwnProperty in id`, async done => {
//
//     await manm.insert({}, {
//         title: 'test'
//     });
//
//     const a = function () {};
//
//     a.prototype.other = 'other';
//
//     const b = function (t) { this.id = t };
//
//     b.prototype = Object.create(a.prototype);
//
//     b.prototype.constructor = b;
//
//     const c = new b(1);
//
//     const affectedRows = await manm.update({}, {title: 'test2'}, c);
//
//     expect(affectedRows).toEqual(1);
//
//     const all = await manm.findAll({});
//
//     expect(all).toEqual([{"id": 1, "title": "test2", "user_id": null}]);
//
//     done();
// });
//
// it(`knex - mysql - update, many at once`, async done => {
//
//     await manm.insert({}, {title: 'test1'});
//
//     await manm.insert({}, {title: 'test2'});
//
//     const affectedRows = await manm.update({}, {title:'update'});
//
//     expect(affectedRows).toEqual(2);
//
//     const all = await manm.findAll({});
//
//     expect(all).toEqual([
//         {"id": 1, "title": "update", "user_id": null},
//         {"id": 2, "title": "update", "user_id": null}
//     ]);
//
//     done();
// });
