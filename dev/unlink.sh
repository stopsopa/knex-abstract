
#cd github && npm unlink
#echo -e "In your project run\n    npm unlink --no-save <module_name>\n to don't use linked library"
#echo "https://medium.com/@alexishevia/the-magic-behind-npm-link-d94dcb3a81af"
#echo "to see global node_module: npm root -g"

set -e
set -x

PATH="$(npm root -g)"

echo "npm global node_module: '$PATH'";

LIB="${PATH}/@stopsopa/knex-abstract";

if [ -e "$LIB" ]; then

    unlink "$LIB" || true;

    if [ -e "$LIB" ]; then

        printf "\n\nCan't remove 'knex-abstract' symlink from global node_module: '$LIB', try to run manually:\n\n    unlink \"$LIB\"\n    make islinked\n\n"

        exit 1;
    fi
else

    printf "\n\n    'knex-abstract' symlink doesn't exist in global node_module: '$LIB'\n\n"
fi

