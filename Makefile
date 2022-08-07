u: # update npm and git (generates new tag)
	@/bin/bash update.sh

uf: # update even if there is nothing new committed
	@/bin/bash update.sh force

h: # show any help that is available
	@/bin/bash test.sh --help
	@echo https://github.com/stopsopa/knex-abstract

t: # just run tests once
	@/bin/bash test.sh

tw: # run tests in watch mode
	@/bin/bash test.sh --watch

twa: # run tests in watchAll mode
	@/bin/bash test.sh --watchAll

c: # run local server to browse coverage
	@node server.js --log 15 --port 8081 --dir coverage

cc: # run local server to general testing
	@nodemon -e js,html server.js --log 15

nt: # test .npmignore
	@npm pack

ct: # travis parameters.json
	@/bin/bash update.sh --dev

cp: # jest parameters.json
	@/bin/bash update.sh --prod

up: down
	/bin/bash docker/docker-compose.sh up

down:
	/bin/bash docker/docker-compose.sh down

islinked:
	@cd dev && /bin/bash islinked.sh

link:
	make -s cp || true
	npm link
	npm link knex-abstract
	(cd migrations && make -s link)

unlink:
	@cd dev && /bin/bash unlink.sh

manual:
	nodemon -e js,html manual.js




fixtures:
	(cd migrations && node recreate-db.js safe)
	(cd migrations && make -s mrun)

diff:
	(cd migrations && make -s diff)

mrun:
	(cd migrations && make -s mrun)

torun:
	(cd migrations && make -s torun)

mrevert:
	(cd migrations && make -s mrevert)

mtest:
	(cd migrations && make -s mtest)

