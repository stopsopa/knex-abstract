#!/bin/bash

set -e

##
# Script to determine how many migrations left to apply
# !! useless for CI
##

THISFILE=${BASH_SOURCE[0]}
DIR="$( cd "$( dirname "${THISFILE}" )" && pwd -P )"

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

MIGRATIONFILES="$(ls -la "$DIR/../src/migration/" | grep '.ts' | wc -l)"

MIGRATIONFILES="$(trim "$MIGRATIONFILES")"

#set -x

MIGRATIONSINDB="$(node mcount.js)"

#echo ">>>DB: $MIGRATIONSINDB - FI: $MIGRATIONFILES<<<"

DIFF="$(($MIGRATIONFILES - $MIGRATIONSINDB))"

if [ "$DIFF" -lt "0" ]; then

    echo "DIFF ($DIFF) can't be smaller than 0"

    exit 1;
fi

echo $DIFF




