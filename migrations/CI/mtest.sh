#!/bin/bash

function green {
    printf "\e[32m$1\e[0m\n"
}

if [ "$(/bin/bash torun.sh)" = "0" ]; then

    green "\n\nreverting:\n\n"
    # make mrevert
    (cd .. && node node_modules/.bin/ts-node node_modules/.bin/typeorm migration:revert)
fi


green "\n\nexecuting last migration:\n\n"

/bin/bash mrun.sh