
#cd github && npm unlink
#echo -e "In your project run\n    npm unlink --no-save <module_name>\n to don't use linked library"
#echo "https://medium.com/@alexishevia/the-magic-behind-npm-link-d94dcb3a81af"
#echo "to see global node_module: npm root -g"

MODULE="knex-abstract"

set -e
set -x

PATH_="$(npm root -g)"

echo "npm global node_module: '$PATH_'";

LIB="$PATH_/$MODULE";

if [ -e "$LIB" ]; then

    unlink "$LIB" || true;

    if [ -e "$LIB" ]; then

        printf "\n\nCan't remove '$MODULE' symlink from global node_module: '$LIB', try to run manually:\n\n    unlink \"$LIB\"\n    make islinked\n\n"

        exit 1;
    fi
else

    printf "\n\n    '$MODULE' symlink doesn't exist in global node_module: '$LIB'\n\n"
fi

