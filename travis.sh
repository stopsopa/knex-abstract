
set -e
set -x

function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}

make ct

yarn

# yarn add codecov "jest"@"^23.6.0" --dev

EXECUTE="/bin/bash test.sh"

green "\n\n    executing tests:\n        $EXECUTE\n\n"

$EXECUTE

STATUS=$?

# cat ./coverage/lcov.info | node node_modules/coveralls/bin/coveralls.js -v | grep -v "@"
node node_modules/.bin/codecov

exit $?
