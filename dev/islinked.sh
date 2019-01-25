
MODULE="knex-abstract"


PATH_="$(npm root -g)"

echo "npm global node_module: '$PATH_'";

LIB="$PATH_/$MODULE";

LOCAL="$(cd .. && node install/install.js --is-linked)"

echo "LOCAL  : >>$LOCAL<<"

GLOBAL="$($LIB/install/install.js --is-linked)"

echo "GLOBAL : >>$GLOBAL<<"

function red {
    printf "\e[91m$1\e[0m\n"
}
function green {
    printf "\e[32m$1\e[0m\n"
}

if [ "$GLOBAL" = "$LOCAL" ]; then

    green "linked globally"
else

    red "NOT linked globally"

    exit 1
fi
