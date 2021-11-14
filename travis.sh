
exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}

if [ ! -f "yarn.lock" ]; then

  { red "\n\n    yarn.lock should exist - travis will install dependencies faster if it does\n\n   It should also match to package.json (PROD)n\n"; } 2>&3
fi

set -e
set -x

make yarn

cp .env.travis .env

make fixtures

EXECUTE="/bin/bash test.sh"

{ green "\n\n    executing tests:\n        $EXECUTE\n\n"; } 2>&3

$EXECUTE

knex-abstract

cp .env.travis knex-project/.env

cd knex-project

OUT="$(node test.js)"

STATUS="$?";

if [[ "$OUT" = *"count: 5"* ]] && [[ "$OUT" = *"\"Database\": \"knex\""* ]]; then

    echo 'output is good'
else

    echo 'output is NOT good'

    echo "stdout: >>$OUT<<"

    exit 1
fi

cd ..

# cat ./coverage/lcov.info | node node_modules/coveralls/bin/coveralls.js -v | grep -v "@"
node node_modules/.bin/codecov


