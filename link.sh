source "bash/trim.sh";

set -x

if [ "${1}" = "" ]; then

    echo "${0} error: provide how many files are expected to be in npm package"

    exit 1
fi

if ! [[ ${1} =~ ^[0-9]+$ ]]; then

    echo "${0} error: arg1 should be an integer"

    exit 1;
fi

_PWD="$(pwd)"

rm -rf var/package

rm -rf var/*.tgz || true

npm pack --pack-destination var/

if [ "${?}" != "0" ]; then

    echo "npm pack --pack-destination var/ failed"

    echo /home/runner/.npm/
    ls -la /home/runner/.npm/

    echo ""
    echo ""
    echo ""

    cat /home/runner/.npm/*
    echo ""
    echo ""
    echo ""

    exit 1
fi

FILE="$(ls var/ | grep "\.tgz$")"

FILE="$(trim "${FILE}")"

if [ "${FILE}" = "" ]; then

    echo "${0} error: /var/*.tgz file doesn't exist"

    exit 1;
fi

cd var

cat <<EEE
    unpacking "${FILE}"

EEE

LIST="$(tar -zxvf "${FILE}" 2>&1)"

cat <<EEE
    numbering unpacked files in ${FILE}

EEE

NUMBERED_LIST="$(echo "${LIST}" | nl -w3 -s': ')"

echo "${NUMBERED_LIST}"

cd "${_PWD}"

FOUND_NUM="$(echo "${NUMBERED_LIST}" | wc -l)"

FOUND_NUM="$(trim "${FOUND_NUM}")"

cat <<EEE

    number of found unpacked files: ${FOUND_NUM}
EEE

cd node_modules 
rm -rf knex-abstract
ln -s ../var/package knex-abstract
cd "${_PWD}"

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

if [ "${FOUND_NUM}" = "${1}" ]; then

cat <<EEE
    ${0} test: there should be ${1} files in npm package, and indeed found ${FOUND_NUM}

EEE
else

cat <<EEE
    ${0} error: ${FOUND_NUM} files in npm package, but should be ${1}

EEE

    exit 1;
fi

echo "all good ..."
