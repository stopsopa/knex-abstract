
# local dev instance
    mkdir knex
    cd knex
    
    git clone git@github.com:stopsopa/knex-abstract.git .
    make doc
    sleep 15
    cp .env.dist .env
    cp migrations/ormconfig.js.dist migrations/ormconfig.js
    yarn
    # for some reason first time it will crash - I don't care for development
    make fixtures 
    make fixtures
    make t
    echo 'done...'
    
# update

    npm login
    make u
        
# test

    make t
    
# test locally installer

    # go to main directory of the project, (in this example to 'knex' directory)
    # and run:
    npm link
    # go to another directory and simply run:
    knex-abstract
    
# inspect coverage

run local server

    make c
    
# other

see Makefile...                
    