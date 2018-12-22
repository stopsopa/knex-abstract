
#cd lib-npm-link && npm unlink
#echo -e "In your project run\n    npm unlink --no-save <module_name>\n to don't use linked library"
#echo "https://medium.com/@alexishevia/the-magic-behind-npm-link-d94dcb3a81af"
#echo "to see global node_module: npm root -g"

set -e
set -x

PATH="$(npm root -g)"

echo "npm global node_module: '$PATH'";

RODERIC="${PATH}/roderic";

if [ -e "$RODERIC" ]; then

    unlink $RODERIC;

    if [ -e "$RODERIC" ]; then

        echo "Can't remove 'roderic' symlink from global node_module: '$RODERIC'"

        exit 1;
    fi
else

    echo "'roderic' symlink doesn't exist in global node_module: '$RODERIC'"
fi

