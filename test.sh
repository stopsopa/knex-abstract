

function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}



        # to make sure that knex-abstract is linked -
        # it is reaquired for testing due to require('@stopsopa/knex-abstract') in tests

        LOCVER="$(node install/install.js --is-linked)";

        echo "LOCVER: >>>$LOCVER<<<"

        if [ ! -e node_modules ]; then

            yarn
        fi

        if [ ! -e node_modules/.bin/jest ]; then

            yarn add jest --dev
        fi

        if [[ "$(knex-abstract --is-linked)" = "$LOCVER" ]]; then

            echo "knex-abstract is linked"

        else

            set -e
            set -x

            yarn

            npm link

            if [[ "$(knex-abstract --is-linked)" != "$LOCVER" ]]; then

                printf "\n\n    can't link knex-abstract\n\n"

                exit 1
            fi

            set +e
            set +x
        fi


        if [[ "$(node node_modules/\@stopsopa/knex-abstract/install/install.js --is-linked)" = "$LOCVER" ]]; then

            echo "knex-abstract is linked in main target directory"

        else

            npm link @stopsopa/knex-abstract

            if [[ "$(node node_modules/\@stopsopa/knex-abstract/install/install.js --is-linked)" != "$LOCVER" ]]; then

                echo "can't link knex-abstract in main target directory."

                exit 1
            fi
        fi



if [ "$1" = "--help" ]; then

cat << EOF

    /bin/bash $0 --help
    /bin/bash $0 --watchAll

EOF

    exit 0
fi

JEST=""

set -e
set -x

if [ -f node_modules/.bin/jest ]; then  # exist

    green "node_modules/.bin/jest - exists"

    JEST="node node_modules/.bin/jest"
else

    green "node_modules/.bin/jest - doesn't exist"
fi

if [ "$JEST" = "" ]; then

    green "local jest - not found"

    jest -v > /dev/null

    STAT="$?"

    green "(jest -v) status: $STAT";

    if [ "$STAT" = "0" ]; then

        green "global jest - found"

        JEST="jest"
    else

        red "\n    Can't detect jest, install globally: \n   npm install jest -g\n\n";

        exit 1;
    fi
else

    green "local jest - found"
fi

if [[ "$(ls -la node_modules/@stopsopa | grep knex-abstract)" = *"->"* ]]; then

    echo "knex-abstract is linked"

else

    npm link
    (cd test && npm link @stopsopa/knex-abstract)
fi

# --bail \

TEST="$(cat <<END
$JEST \
$@ \
--verbose \
--runInBand \
--modulePathIgnorePatterns test/examples test/jest test/minefield test/project test/puppeteer karma_build
END
)";


green "\n\n    executing tests:\n        $TEST\n\n"

$TEST

STATUS=$?

if [ "$STATUS" = "0" ]; then

    green "\n    Tests passed\n";
else

    red "\n    Tests crashed\n";

    exit $STATUS
fi
