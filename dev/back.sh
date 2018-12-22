

set -e

set -x

sudo chmod -R a+w .

#if [ -e roderic-project/react/node_modules/react ]; then

#    mv roderic-project/react/node_modules make-b-node-module
#fi

#if [ -e roderic-project/puppeteer/node_modules ]; then

#    mv roderic-project/puppeteer/node_modules make-b-pup-node-module
#fi

#cp -R roderic-project/app/* github/app/
#cp -R roderic-project/puppeteer/* github/puppeteer/

#rm -rf roderic-project/public/asset
#rm -rf roderic-project/public/dist
#cp -R  roderic-project/public/* github/public/





#cp -R roderic-project/react/preprocessor/* github/preprocessor/



#cp -R roderic-project/react/package.json github/
#cp -R roderic-project/react/yarn.lock github/
#cp -R roderic-project/react/package-lock.json github/

#cp -R roderic-project/react/config.js github/
#cp -R roderic-project/react/preprocessor.js github/
#cp -R roderic-project/react/webpack.config.js github/

#if [ -e make-b-node-module ]; then

#    mv make-b-node-module roderic-project/react/node_modules
#fi

#if [ -e make-b-pup-node-module ]; then

#    mv make-b-pup-node-module roderic-project/puppeteer/node_modules
#fi

rm -rf github/example/*

if [ -e knex-abstract/node_modules ]; then
    mv knex-abstract/node_modules knex-node_modules
fi;

cp -R knex-abstract/* github/example/
cp -R back.sh github/dev/back.sh
cp -R test.sh github/dev/test.sh
cp -R Makefile github/dev/Makefile

if [ -e knex-node_modules ]; then
    mv knex-node_modules knex-abstract/node_modules
fi;

set +e

set +x

printf "\n    All good... \n\n"

exit 0;

# to revert:
sudo ls -la


sudo chmod -R a+w .
mv make-b-node-module/ roderic-project/react/node_modules
mv make-b-pup-node-module/ roderic-project/puppeteer/node_modules



