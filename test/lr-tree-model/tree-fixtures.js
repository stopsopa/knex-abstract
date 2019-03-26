
const fs                = require('fs');

const yaml              = require('js-yaml');

const log               = require('inspc');

const isArray           = require('nlab/isArray');

function enrich (node, l = 1, level = 1, sort = 1) {

    node.l     = l ++;

    node.level = level;

    node.sort  = sort;

    if (isArray(node.children)) {

        for (let i = 0, len = node.children.length ; i < len ; i += 1 ) {

            l = enrich(node.children[i], l, level + 1, i + 1);
        }
    }

    node.r = l ++;

    return l;
}

module.exports = ({
    yamlFile,
    knex,
}) => {

    const connection = knex();

    const model = connection.model;

    const man = model.tree;

    const fixtures  = yaml.safeLoad(fs.readFileSync(yamlFile, 'utf8')).root;

    enrich(fixtures);

    async function iterateReset(trx, rawNode, parent_id) {

        if (parent_id) {

            rawNode.parent_id = parent_id;
        }

        const {
            children,
            ...node
        } = rawNode;

        const id = await man.insert(node);

        if (isArray(children)) {

            for (let i = 0, len = children.length ; i < len ; i += 1 ) {

                await iterateReset(trx, children[i], id);
            }
        }
    }

    const tools = {
        reset: async () => {

            return await connection.transaction(async trx => {

                await man.query(trx, 'TRUNCATE :table:');

                await iterateReset(trx, fixtures);
            })
        },
    }

    return tools;
};