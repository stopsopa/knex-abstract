h: # just list all available commands
	@printf "\nhttps://github.com/typeorm/typeorm/tree/master/docs\n\n"
	@printf "node node_modules/.bin/ts-node --project tsconfig.json node_modules/.bin/typeorm\n\n"

# too see what are the differences between schema and real db
#(this command is not changing anything in db - just read and compare - ALWAYS SAFE)
schema:
	@node node_modules/.bin/ts-node --project tsconfig.json node_modules/.bin/typeorm schema:log

diff: # to generate new migration with diff sql based on manual changes of schema
	@node node_modules/.bin/ts-node --project tsconfig.json node_modules/.bin/typeorm migration:generate --name auto

migrate: # execute all pending migrations
	@node node_modules/.bin/ts-node --project tsconfig.json node_modules/.bin/typeorm migration:run

sync: # doctrine:schema:update --force - BE CAREFUL IT MIGHT BREAK DATA IN FOREIGN KEY COLLUMNS
	@printf "This is dangerous command so run it yourself manually"
	@printf "\n\n    node node_modules/.bin/ts-node --project tsconfig.json node_modules/.bin/typeorm schema:sync\n\n";

drop: # removes all tables with data from db - BE CAREFUL IT MIGHT BE DANGEROUS
	@printf "This is dangerous command so run it yourself manually"
	@printf "\n\n    node node_modules/.bin/ts-node --project tsconfig.json node_modules/.bin/typeorm schema:drop\n\n";
