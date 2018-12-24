# https://docs.docker.com/compose/reference/envvars/#compose_project_name
COMPOSE_PROJECT_NAME:="$(shell cat docker/name.conf)"

export COMPOSE_PROJECT_NAME

fixtures:
	node test/recreate-db.js
	(cd migrations && make mrun)

islinked:
	@cd dev && /bin/bash islinked.sh

link:
	npm link

unlink:
	@cd dev && /bin/bash unlink.sh

