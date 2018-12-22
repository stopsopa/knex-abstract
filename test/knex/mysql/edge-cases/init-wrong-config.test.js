'use strict';

const log               = require('../../../../log/logn');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(3, false, 'tests');

// const config            = require('../../../../example/models/config');

it('knex - init wrong config - part 1', async done => {

    try {

        knex.init();
    }
    catch (e) {

        expect(e + '').toEqual('knex.js: init(config), config has to be an object');

        done();
    }

});

it('knex - init wrong config - part 2', async done => {

    try {

        knex.init(true);
    }
    catch (e) {

        expect(e + '').toEqual('knex.js: init(config), config has to be an object');

        done();
    }

});


it('knex - init wrong config - part 3', async done => {

    try {

        knex.init({});
    }
    catch (e) {

        expect(e + '').toEqual("knex.js: key 'knex' is an object but there is not connections defined in it");

        done();
    }

});
