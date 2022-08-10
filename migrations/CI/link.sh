#!/bin/bash

#export MIGRATION_MODE=true
#
#function cleanup {
#
#    unset MIGRATION_MODE;
#}
#
#trap cleanup EXIT;

_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"

NM="$_DIR/../node_modules"

if [ -e "$NM" ]; then

    echo "${NM} exist"

    exit 0;
fi

NM2="$_DIR/../../node_modules"

if ! [ -e "$NM2" ]; then

    echo "'$NM' and '$NM2' doesn't exist"

    exit 1;
fi

(cd "$_DIR/.." && ln -s ../node_modules node_modules)

if ! [ -e "$NM" ]; then

    echo "couldn't create '$NM'"

    exit 1;
fi





