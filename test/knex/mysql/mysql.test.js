'use strict';

const log               = require('../../../log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

const config            = require('../../../example/models/config');

knex.init(config);

it('knex - mysql', async done => {

    const man = knex().model.common;

    const list = await man.query(true, 'show databases');

    let tmp = list.map(x => Object.values(x)[0]);

    const db = process.env.PROTECTED_MYSQL_DB;

    if (db) {

        const found = tmp.find(x => x === db);

        man.destroy();

        expect(found).toEqual(db);

        done();
    }
});

it(`knex - mysql - shouldn't be alone`, async done => {

    const man = knex().model.common;

    try {

        await man.query(true);
    }
    catch (e) {

        expect(e + '').toEqual(`First argument is bool but it shouldn't be the only argument`);

        done();
    }
});


it(`knex - mysql - init`, async done => {

    const man = knex().model.common;

    const init = await man.initial();

    expect(init).toEqual({prototype:'MYSQL: prototype.initial()'});

    done();
});
