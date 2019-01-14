[![Build Status](https://travis-ci.org/stopsopa/knex-abstract.svg?branch=v0.0.43)](https://travis-ci.org/stopsopa/knex-abstract)
[![npm version](https://badge.fury.io/js/%40stopsopa%2Fknex-abstract.svg)](https://badge.fury.io/js/%40stopsopa%2Fknex-abstract)
[![codecov](https://codecov.io/gh/stopsopa/knex-abstract/branch/v0.0.43/graph/badge.svg)](https://codecov.io/gh/stopsopa/knex-abstract/tree/v0.0.43)
[![NpmLicense](https://img.shields.io/npm/l/@stopsopa/knex-abstract.svg)](https://github.com/stopsopa/knex-abstract/blob/master/LICENSE)

# Installation:

    npx @stopsopa/knex-abstract
    cd knex-project
    cat test.js
    # and see Makefile
    
# usege: 

    require('@stopsopa/dotenv-up')(3, false, '.env');
    
    const knex              = require('@stopsopa/knex-abstract');
    
    const config      = require('config');
    
    knex.init(config);
    
    (async function(){
    
        const list = await knex().model.common.raw('show tables');
        
        // ...
    
        knex().destroy();
    })();
    
# examples:
    
- [transactions](migrations/src/migration/1545125154513-auto.ts)

See example of [config](models/config.js)

Follow:

 - [test cases](https://github.com/stopsopa/knex-abstract/blob/master/test/knex/mysql/mysql-insert.test.js)
 - [test script](https://github.com/stopsopa/knex-abstract/blob/master/example/test.js)
