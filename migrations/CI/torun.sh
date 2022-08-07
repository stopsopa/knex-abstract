#!/bin/bash


exec 3<> /dev/null
function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}
set -e

##
# Script to determine how many migrations left to apply
# !! useless for CI
##

THISFILE=${BASH_SOURCE[0]}
_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

trim() {
    local var="$*"
    # remove leading whitespace characters
    var="${var#"${var%%[![:space:]]*}"}"
    # remove trailing whitespace characters
    var="${var%"${var##*[![:space:]]}"}"
    echo -n "$var"
}

MIGRATIONFILES="$(/bin/bash "$_DIR/target.sh")"

MIGRATIONFILES="$(trim "$MIGRATIONFILES")"

#set -x

MIGRATIONSINDB="$(node mcount.js)"

#echo ">>>DB: $MIGRATIONSINDB - FI: $MIGRATIONFILES<<<"

DIFF="$(($MIGRATIONFILES - $MIGRATIONSINDB))"

if [ "$DIFF" -lt "0" ]; then

    { red "DIFF ($DIFF) can't be smaller than 0"; } 2>&3

    exit 1;
fi

echo $DIFF




