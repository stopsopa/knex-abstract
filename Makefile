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

up: down
	/bin/bash docker/docker-compose.sh up

down:
	/bin/bash docker/docker-compose.sh down

link:
	npm link
	npm link knex-abstract
	@cd migrations && make -s link

manual:
	nodemon -e js,html manual.js

yarn:
	/bin/bash bash/swap-files.sh -m dev -- yarn --production=false

style_fix:
	/bin/bash bash/swap-files.sh -m dev -- yarn style:fix


