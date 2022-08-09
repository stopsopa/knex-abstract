
source "bash/trim.sh";

rm -rf var/package

rm -rf var/*.tgz

npm pack --pack-destination var/

FILE="$(ls var/ | grep "\.tgz$")"

FILE="$(trim "${FILE}")"

if [ "${FILE}" = "" ]; then

    echo "${0} error: /var/*.tgz file doesn't exist"

    exit 1;
fi

(cd var && tar -zxvf "${FILE}")

(
    cd node_modules 
    rm -rf knex-abstract
    ln -s ../var/package knex-abstract
)

echo ""
echo "ls -la var/"
ls -la var/

echo ""
echo "ls -la var/package/"
ls -la var/package/

echo ""
echo "ls -la node_modules | grep knex"
ls -la node_modules | grep knex

echo ""

if [ ! -d var/package/ ]; then

    echo "${0} error: var/package/ is not a directory"

    exit 1;
fi


if [ ! -L node_modules/knex-abstract ]; then

    echo "${0} error: node_modules/knex-abstract should be a link"

    exit 1;
fi

echo "all good ..."
