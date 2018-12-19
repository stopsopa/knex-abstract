
# echo 'stop...'
# exit;

sudo chmod -R a+w .

printf "Are you sure (y): "
read q
if [ "$q" != "y" ]; then
    printf "\n... ok then stop.\n"
    exit;
fi

set -e
set -x

sudo id


if [[ "$(ls -la roderic-project/react/node_modules/ | grep roderic)" = *"->"* ]]; then

    echo "roderic is linked"

else

    (cd lib-npm-link && yarn)

    (cd lib-npm-link && npm link)
fi

sudo rm -rf node_modules

mv roderic-project/react/node_modules . || true

    sudo rm -rf node_modules_puppeteer

    mv roderic-project/puppeteer/node_modules node_modules_puppeteer || true

sudo rm -rf roderic-project

roderic

mv node_modules roderic-project/react/node_modules || true

    mv node_modules_puppeteer roderic-project/puppeteer/node_modules || true

if [ ! -e roderic-project/react/node_modules/react ]; then

    (cd roderic-project/react && yarn)
fi

    if [ ! -e roderic-project/puppeteer/node_modules/puppeteer ]; then

        (cd roderic-project/puppeteer && yarn)
    fi

(cd roderic-project/react && npm link roderic)

echo 'Should be symlink not real directory:';
(cd roderic-project/react && ls -la node_modules | grep roderic)

(cd roderic-project/react && sudo yarn dev)
