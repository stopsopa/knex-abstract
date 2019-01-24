'use strict';

const log               = require('inspc');

const knex              = require('@stopsopa/knex-abstract');

require('@stopsopa/dotenv-up')(5, false, 'tests');

// const config            = require('../../../../models/config');

it('knex - init wrong config - part 1', async done => {

    try {

        knex.init();
    }
    catch (e) {

        expect(e + '').toEqual('@stopsopa/knex-abstract: init(config), config has to be an object');

        done();
    }

});

it('knex - init wrong config - part 2', async done => {

    try {

        knex.init(true);
    }
    catch (e) {

        expect(e + '').toEqual('@stopsopa/knex-abstract: init(config), config has to be an object');

        done();
    }

});


it('knex - init wrong config - part 3', async done => {

    try {

        knex.init({});
    }
    catch (e) {

        expect(e + '').toEqual("@stopsopa/knex-abstract: key 'knex' is an object but there is not connections defined in it");

        done();
    }

});
