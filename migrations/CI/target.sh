#!/bin/bash

#export MIGRATION_MODE=true
#
#function cleanup {
#
#    unset MIGRATION_MODE;
#}
#
#trap cleanup EXIT;

# return number of migration that supposed to be executed against db
# based on numbr of migration files .ts

exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}
set -e

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

/bin/bash "$_DIR/link.sh"

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

MIGRATIONDIR="$(node "$_DIR/../get.js" cli.migrationsDir 'src/migration')"

MIGRATIONFILES="$(ls -la "$_DIR/../$MIGRATIONDIR/" | grep '.ts' | wc -l)"

MIGRATIONFILES="$(trim "$MIGRATIONFILES")"

TEST="^-?[0-9]+$"

if ! [[ "$MIGRATIONFILES" =~ $TEST ]]; then

    { red "MIGRATIONFILES ($MIGRATIONFILES) didn't match '$TEST'"; } 2>&3

    exit 1;
fi

printf $MIGRATIONFILES




