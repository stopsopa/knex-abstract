[![Build Status](https://travis-ci.org/stopsopa/knex-abstract.svg?branch=v0.0.77)](https://travis-ci.org/stopsopa/knex-abstract)
[![npm version](https://badge.fury.io/js/knex-abstract.svg)](https://badge.fury.io/js/knex-abstract)
[![codecov](https://codecov.io/gh/stopsopa/knex-abstract/branch/v0.0.77/graph/badge.svg)](https://codecov.io/gh/stopsopa/knex-abstract/tree/v0.0.77)
[![NpmLicense](https://img.shields.io/npm/l/knex-abstract.svg)](https://github.com/knex-abstract/blob/master/LICENSE)

# Installation:

    npx knex-abstract
    cd knex-project
    cat test.js
    # and see Makefile
    
# usege: 

    require('dotenv-up')(4, false, '.env');
    
    const knex              = require('knex-abstract');
    
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

# Dev notes

```bash

git clone https://github.com/stopsopa/knex-abstract.git 
cd knex-abstract
make doc
sleep 10 # give little time for mysql docker to start
make ct
cp .env.dist .env
cp migrations/ormconfig.js.dist migrations/ormconfig.js
yarn
npm install --global nodemon
make link
make fixtures
make manual


```

.. and simply visit http://localhost:8080/
