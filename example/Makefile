# https://docs.docker.com/compose/reference/envvars/#compose_project_name
COMPOSE_PROJECT_NAME:="$(shell cat docker/name.conf)"

export COMPOSE_PROJECT_NAME

h:
	@echo "see migrations/Makefile"

fixtures:
	(cd migrations && node recreate-db.js safe)
	(cd migrations && make mrun)

doc: docs
	(cd docker && docker-compose build)
	(cd docker && docker-compose up -d --build)

docs:
	cd docker && docker-compose stop

islinked:
	@cd dev && /bin/bash islinked.sh

link:
	npm link

unlink:
	@cd dev && /bin/bash unlink.sh

