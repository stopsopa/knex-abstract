'use strict';

const log               = require('../../../src/log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../models/config');

knex.init(config);

let man;

let manc;

let manm;

beforeAll(async () => {

    manc    = knex().model.common;

    man     = knex().model.users;

    manm    = knex().model.many;

    await clear();
});

afterAll(async () => {

    await clear();

    await man.destroy();
});

const clear = async () => {

    await manc.raw(`truncate many`);
};

beforeEach(clear);

it(`knex - mysql - insert`, async done => {

    await manm.insert({
        title: 'test'
    });

    const id = await manm.insert({
        title: 'test'
    });

    expect(id).toEqual(2);

    done();
});

it(`knex - mysql - insert, hasOwnProperty`, async done => {

    await manm.insert({
        title: 'test'
    });

    const a = function () {};
    a.prototype.other = 'other';

    const b = function (t) { this.title = t };

    b.prototype = Object.create(a.prototype);

    b.prototype.constructor = b;

    const c = new b('custom');

    const id = await manm.insert(c);

    expect(id).toEqual(2);

    const count = await manm.count();

    expect(count).toEqual(2);

    done();
});
