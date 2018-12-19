

set -e

set -x

sudo chmod -R a+w .

if [ -e roderic-project/react/node_modules/react ]; then

    mv roderic-project/react/node_modules make-b-node-module
fi

if [ -e roderic-project/puppeteer/node_modules ]; then

    mv roderic-project/puppeteer/node_modules make-b-pup-node-module
fi

cp -R roderic-project/app/* lib-npm-link/app/
cp -R roderic-project/puppeteer/* lib-npm-link/puppeteer/

rm -rf roderic-project/public/asset
rm -rf roderic-project/public/dist
cp -R  roderic-project/public/* lib-npm-link/public/





cp -R roderic-project/react/preprocessor/* lib-npm-link/preprocessor/



cp -R roderic-project/react/package.json lib-npm-link/
cp -R roderic-project/react/yarn.lock lib-npm-link/
cp -R roderic-project/react/package-lock.json lib-npm-link/

cp -R roderic-project/react/config.js lib-npm-link/
cp -R roderic-project/react/preprocessor.js lib-npm-link/
cp -R roderic-project/react/webpack.config.js lib-npm-link/

if [ -e make-b-node-module ]; then

    mv make-b-node-module roderic-project/react/node_modules
fi

if [ -e make-b-pup-node-module ]; then

    mv make-b-pup-node-module roderic-project/puppeteer/node_modules
fi

set +e

set +x

printf "\n    All good... \n\n"

exit 0;

# to revert:
sudo ls -la


sudo chmod -R a+w .
mv make-b-node-module/ roderic-project/react/node_modules
mv make-b-pup-node-module/ roderic-project/puppeteer/node_modules



