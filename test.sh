

exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}


if [ ! -e node_modules ]; then

    make yarn
fi

set -e
set -x


if [ -L node_modules/knex-abstract ]; then

    { green "knex-abstract is linked"; } 2>&3
else

    npm link

    npm link knex-abstract
fi

set +e
set +x

if [ ! -e .env ]; then

    cp .env.dist .env
fi

if [ "$1" = "--help" ]; then

cat << EOF

    /bin/bash $0 --help
    /bin/bash $0 --watch                        ## this will run only changed test
    /bin/bash $0 --watchAll                     ## this will run all test on every change
    /bin/bash $0 [--watch|--watchAll] test/...  ## will run one test file or dir with tests 
    /bin/bash $0 -t 'filter test'               ## this will run only tests matching the provided string

EOF

    exit 0
fi

JEST=""

set -e
set -x

JEST="node node_modules/.bin/jest"

# --bail \
# --detectOpenHandles \
# --silent=false \
# --verbose false \
# --detectOpenHandles \

TEST="$(cat <<END
$JEST \
$@ \
--verbose \
--roots test \
--runInBand \
--modulePathIgnorePatterns \
    test/examples \
    test/jest \
    test/minefield \
    test/project \
    test/puppeteer \
    karma_build \
    test/knex/postgres
END
)";


{ green "\n\n    executing tests:\n        $TEST\n\n"; } 2>&3

$TEST

STATUS=$?

if [ "$STATUS" = "0" ]; then

    { green "\n    Tests passed\n"; } 2>&3
else

    { red "\n    Tests crashed\n"; } 2>&3

    exit $STATUS
fi
