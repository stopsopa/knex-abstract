[![Build Status](https://travis-ci.org/stopsopa/knex-abstract.svg?branch=v0.0.89)](https://travis-ci.org/stopsopa/knex-abstract)
[![npm version](https://badge.fury.io/js/knex-abstract.svg)](https://badge.fury.io/js/knex-abstract)
[![codecov](https://codecov.io/gh/stopsopa/knex-abstract/branch/v0.0.89/graph/badge.svg)](https://codecov.io/gh/stopsopa/knex-abstract/tree/v0.0.89)
[![NpmLicense](https://img.shields.io/npm/l/knex-abstract.svg)](https://github.com/knex-abstract/blob/master/LICENSE)


[![knex-abstract youtube demo - nested set example](yt.png)](https://youtu.be/d8k98noOR5c)


# Installation:

    npx knex-abstract
    # follow instruction on the screen
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
    
        
    })();
    
# examples:

See example of [config](models/config.js)

Follow:

 - [test cases](https://github.com/stopsopa/knex-abstract/blob/master/test/knex/mysql/mysql-insert.test.js)
 - [test script](https://github.com/stopsopa/knex-abstract/blob/master/example/test.js)
 
# Api

```javascript

import knex from 'knex-abstract';

const man = knex().model.registered_manager_name;

(async function () {
    
    /**
     * Just helper to process parameters, return raw data as it is returned from native knex
     */
    const result = await man.raw(`select * from ...`, {...params});
    
    /**
     * The same like .raw() but it extracts proper response data
     * 
     * NOTE: Uses .raw() internally
     */
    const data1 = await man.query(`select * from ...`, {...params});
    
    /**    
     * the same like query but ... 
     * ... it will also pass data through fromDb()
     * 
     * uses internally fromDb();
     * 
     * NOTE: Uses .query() internally
     * 
     * uses: fromDb     
     */
    const data2 = await man.fetch(`select * from ...`, {...params});
    
    /**
     * Extract data 
     * @throws Error - if found more then one
     * @return undefined - if nothing found, object if found one
     * 
     * NOTE: Uses .query() internally
     * 
     * uses: fromDb     
     */
    const row1 = await man.queryOne(`select * from ...`, {...params});
    
    /**
     * Returns value from first column of first found row 
     * 
     * Extract data 
     * @throws Error - if found more then one
     * @return undefined - if nothing found, object if found one
     * 
     * NOTE: Uses .queryOne() internally - inherites .queryOne() throws
     * 
     * uses: fromDb 
     */
    const count1 = await man.queryColumn(`select count(*) c from ...`, {...params});
    
    /**
     * Count all rows in table
     * 
     * NOTE: Uses .queryColumn() internally - inherites .queryOne() throws
     */
    const count2 = await man.count();
    
    /**
     * Different version of queryOne that accept only 'select' of query and id in parameters
     * 
     * NOTE: Uses .queryOne() internally - inherites .queryOne() throws
     * 
     * uses: fromDb 
     */
    const row2 = await man.find(`id, title, ...`);
    
    /**
     * Returns all rows from table - quite ofthen useful if there is not many rows in table
     * 
     * NOTE: Uses .fetch() internally 
     * 
     * uses: fromDb 
     */
    const list1 = await man.findAll();
    
    /**
     * NOTE: Uses .query() internally
     * 
     * uses: toDb     
     */
    const newRowId = await man.insert({
        col1: 'col1 value',
        col2: 'col2 value',
        ...
    });
    
    /**
     * NOTE: Uses .query() internally
     * 
     * @param object entity
     * @param string|integer|object id
     * @return affectedRows
     * uses: toDb     
     */
    const affectedRows1 = await man.update({
        col1: 'col1 value',
        col2: 'col2 value',
        ...
    }, {id: 'idvalue'});
    
    /**
     * NOTE: Uses .query() internally
     * 
     * @param string|integer|object id
     * @return affectedRows
     */
    const affectedRows2 = await man.delete({id: 'idvalue'});
    
    /**
     * Create transaction internally if there is no trx object given in first parameter
     */
    await this.transactify(trx, async trx => {

        const id = await this.insert(trx, {
            title,
        });
    });
    
    /**
     * This way you are using internally .transaction() method on native knex object 
     */
    await this.transactify(async trx => {

        const id = await this.insert(trx, {
            title,
        });
    });
    
}());



``` 

For more informations see [source code](src/mysql.js)

# Debugging and transactions

All above methods accept additional extra parameters:
 - debug - boolean (default false)
    parameter force to pring internal queries to the cli console
 - trx - function (default empty)
    optional parameter to pass outher transaction object in order to execute logic of specific method inside external transaction
    
types function and boolean are reserved for this two parameters in all above methods

Example use case: 
    
- [transactions](migrations/src/migration/1545125154513-auto.ts)

    
 
# Nested set

```javascript

// tags.js
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const a                 = prototype.a;

const nestedset         = require('knex-abstract/nestedset');

const table             = 'tags';

const id                = 'id';

module.exports = knex => extend(knex, prototype, Object.assign(nestedset({
    columns: {
        l       : 'l',
        r       : 'r',
        level   : 'level',
        pid     : 'parent_id',
        sort    : 'sort',
    }
}), {
    initialize: () => {} // other custom methods
}), table, id);

``` 

And from now on manager will have extra available methods:

```javascript

const knex          = require('knex-abstract');

(async function () {
    

    const man = knex().model.tags;
        
    // this method will initialize columns level, sort, l, r
    // and if root already exist this method will check if it's valid
    const root = await man.treeInit({ 
        title: 'root'
    });
    
    // will find element with only id, parent_id, level, sort, l, r columns
    // columns will be normalized to regular names pid, level, sort, l, r even if real columns in 
    // database are different
    const node = await man.treeFindOne();
    
    // ... and others
    
    
    
        
    
})()

```

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
