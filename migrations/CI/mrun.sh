
set -e
set -x

function red {
    printf "\e[91m$1\e[0m\n"
}

if [ ! -e ../ormconfig.js ]; then

    red "ormconfig.js doesn't exist, use template file ormconfig.js.dist"

    exit 1;
fi

if [ ! -e ../node_modules ]; then

    (cd ../ && yarn)
fi

TORUN="$(/bin/bash torun.sh)"

# don't stop if something goes wrong from now on - I can handle it
set +e

if [ "$TORUN" = "0" ]; then

    set +x

    echo "[OK]: No new migrations to execute";

    exit 0;
fi

MCOUNT_BEFORE="$(node mcount.js)"

(cd .. && make migrate)

MCOUNT_AFTER="$(node mcount.js)"

DIFF="$(($MCOUNT_AFTER - $MCOUNT_BEFORE))"

if [ "$MCOUNT_AFTER" = "$MCOUNT_BEFORE" ]; then

    echo "[ERROR]:After executing 'make migrate' number of migrations in db is the same - something is not quite right"

    exit 1;
fi

if [ "$DIFF" != "$TORUN" ]; then

    echo "[ERROR]:Number of migrations in db before and after executing new migrations has changed from '$MCOUNT_BEFORE' to '$MCOUNT_AFTER', difference NOT match expected number of migrations to execute (diff should be '$TORUN' and is '$DIFF') - something is not ok, attempt to revert previous number of migrations";

    MCOUNT_BEFORE_LOOP="$MCOUNT_AFTER"
    while true
    do
        (cd .. && make mrevert)

        MCOUNT_AFTER_LOOP="$(node mcount.js)"

        if [ "$MCOUNT_BEFORE_LOOP" = "$MCOUNT_AFTER_LOOP" ]; then

            echo "[ERROR]:Attempt to revert migration failed, number of migration after executing 'make mrevert' should decrease by one, but there is no change, entire loop should revert back migrations to '$MCOUNT_BEFORE' in database step by step - this loop failed"

            exit 1
        fi

        if [ "$MCOUNT_AFTER_LOOP" = "$MCOUNT_BEFORE" ]; then

            echo "[ERROR]: It looks like reverting migrations has been completed successfully, throwing error though (exit code 100) for CI to stop"

            exit 100
        fi
        
        echo "revert loop successful (MCOUNT_BEFORE_LOOP: $MCOUNT_BEFORE_LOOP -> MCOUNT_AFTER_LOOP: $MCOUNT_AFTER_LOOP)"
        
        MCOUNT_BEFORE_LOOP="$MCOUNT_AFTER_LOOP"
    done

    exit 1;
fi

echo "[OK]: Number of migrations in db before and after executing new migrations has changed from '$MCOUNT_BEFORE' to '$MCOUNT_AFTER', difference match expected number of migrations to execute - looks good, carry on";

exit 0;