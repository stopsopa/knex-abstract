
# script is here to assist running docker compose with mysql and pma
# in addition to just spinning those containers it also wait for 'healthy' state of mysql container
# and set proper privileges for external connectivity
# and created database defined in MYSQL_DB env var
# it is also packed with checking that all necessary environments are present

_SHELL="$(ps "${$}" | grep "${$} " | grep -v grep | sed -rn "s/.*[-\/]+(bash|z?sh) .*/\1/p")"; # bash || sh || zsh
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    _PWD="$(pwd)"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    _PWD="$(pwd)"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    _PWD="$(pwd)"
    ;;
esac

ENV="${_DIR}/../.env"

if [ ! -f "${ENV}" ]; then

  echo "${0} error: ${ENV} doesn't exist"

  exit 1
fi

source "${ENV}"

if [ "${PROJECT_NAME}" = "" ]; then

  echo "${0} error: PROJECT_NAME is not defined"

  exit 1
fi

if [ "${PHPMYADMIN_PORT}" = "" ]; then

  echo "${0} error: PHPMYADMIN_PORT is not defined"

  exit 1
fi

if [ "${MYSQL_DB}" = "" ]; then

  echo "${0} error: MYSQL_DB is not defined"

  exit 1
fi

if [ "${MYSQL_PORT}" = "" ]; then

  echo "${0} error: MYSQL_PORT is not defined"

  exit 1
fi

if [ "${MYSQL_PASS}" = "" ]; then

  echo "${0} error: MYSQL_PASS is not defined"

  exit 1
fi

if [ "${PMA_PMADB}" = "" ]; then

  echo "${0} error: PMA_PMADB is not defined"

  exit 1
fi

CONTAINER="mysql_container"

docker exec -i "${CONTAINER}" mysql -u ${MYSQL_USER} -p${MYSQL_PASS} -e "ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASS}'; flush privileges;"

docker exec -i "${CONTAINER}" mysql -u ${MYSQL_USER} -p${MYSQL_PASS} -e "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} /*\!40100 DEFAULT CHARACTER SET utf8 */"

