
exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}
set -e
set -x

npm link

make ct

yarn

npm link @stopsopa/knex-abstract

cp .env.travis .env

cp migrations/ormconfig.js.dist migrations/ormconfig.js

make fixtures

EXECUTE="/bin/bash test.sh"

{ green "\n\n    executing tests:\n        $EXECUTE\n\n"; } 2>&3

$EXECUTE

STATUS=$?

# cat ./coverage/lcov.info | node node_modules/coveralls/bin/coveralls.js -v | grep -v "@"
node node_modules/.bin/codecov

exit $?
