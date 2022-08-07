
const abstract          = require('../../../src');

const extend            = abstract.extend;

const prototype = abstract.prototype_common;

const log               = require('inspc');

const isObject          = require('nlab/isObject');

// const validator         = eval('require')('@stopsopa/validator');

// const {
//     Required,
//     Optional,
//     Collection,
//     All,
//     Blank,
//     Callback,
//     Choice,
//     Count,
//     Email,
//     IsFalse,
//     IsNull,
//     IsTrue,
//     Length,
//     NotBlank,
//     NotNull,
//     Regex,
//     Type,
// } = validator;

const table             = 'users';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
    initialize: async function () {

        const id = await this.raw(`
select r.id from roles r where r.name = ?
`, ['user']).then(role => {
            try {
                return role[0][0].id;
            }
            catch (e) {

            }
        });

        const roles = [];

        if (id) {

            roles.push(id);
        }

        return {
            firstName   : '',
            lastName    : '',
            email       : '',
            password    : '',
            enabled     : false,
            roles,
        }
    },
    fromDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        if (typeof row.roles === 'string') {

            row.roles = row.roles.split(',').map(r => /^\d+$/.test(r) ? parseInt(r, 10) : r).filter(Boolean);
        }

        if ( ! Array.isArray(row.roles) ) {

            row.roles = [];
        }

        if (typeof row.enabled !== 'undefined') {

            row.enabled = !!row.enabled;
        }

        if (typeof row.config === 'string') {

            try {

                row.config = JSON.parse(row.config);
            }
            catch (e) {

                row.config = {};
            }
        }

        return row;
    },
    toDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        if (typeof row.roles !== 'undefined') {

            delete row.roles;
        }

        if (typeof row.created !== 'undefined') {

            delete row.created;
        }

        if (typeof row.updated !== 'undefined') {

            delete row.updated;
        }

        if (!row.config) {

            delete row.config;
        }

        if (typeof row.config !== 'undefined' && typeof row.config !== 'string') {

            row.config = JSON.stringify(row.config, null, 4);
        }

        return row;
    },
    update: function (...args) {

        let [debug, trx, entity, id] = a(args);

        if (Array.isArray(entity.roles)) {

            this.updateRoles(id, entity.roles)
        }

        return prototype.prototype.update.call(this, debug, trx, entity, id);
    },
    insert: async function (...args) {

        let [debug, trx, entity] = a(args);

        let roles = null;

        if (Array.isArray(entity.roles)) {

            roles = entity.roles;
        }

        entity = this.toDb(Object.assign({}, entity));

        const id = await prototype.prototype.insert.call(this, debug, trx, entity);

        if (roles) {

            await this.updateRoles(id, roles);
        }

        return id;
    },
    delete: async function (id, ...args) {

        await this.clearRoles(id);

        return await prototype.prototype.delete.call(this, id, ...args);
    },
    updateRoles: async function (userId, rolesIds) {

        await this.clearRoles(userId);

        if (Array.isArray(rolesIds)) {

            return await Promise.all(rolesIds.map(async role_id => {
                return await knex.model.user_role.insert({
                    user_id: userId,
                    role_id,
                })
            }));
        }
    },
    clearRoles: async function(userId) {

        return await this.query(`delete from user_role where user_id = ?`, [userId]);
    },
    find: function (...args) {

        let [debug, trx, id] = a(args);

        if ( ! id ) {

            throw `user.js::find(): id not specified or invalid`;
        }

        const query = `
SELECT          u.*, GROUP_CONCAT(r.id) roles
FROM            users u
LEFT JOIN       user_role ur
		     ON ur.user_id = u.id
LEFT JOIN       roles r
		     ON ur.role_id = r.id
WHERE           u.id = :id
GROUP BY        u.id
ORDER BY        id desc
        `;

        const params = {id};

        return this.raw(debug, trx, query, params).then(data => {
            // log.dump({
            //     query,
            //     params,
            //     data: data[0][0]
            // })
            return data[0][0];
        }).then(this.fromDb);
    },
    findAll: function (...args) {

        let [debug, trx] = a(args);

        return this.raw(debug, trx, `
SELECT          u.*, GROUP_CONCAT(r.id) roles
FROM            users u
LEFT JOIN       user_role ur
		     ON ur.user_id = u.id
LEFT JOIN       roles r
		     ON ur.role_id = r.id
GROUP BY        u.id
ORDER BY        id desc
        `).then(data => {
            return data[0];
        }).then(list => list.map(this.fromDb));
    },
    prepareToValidate: function (data = {}, mode) {

        data = JSON.parse(JSON.stringify(data));

        if (typeof data.id !== 'undefined') {

            delete data.id;
        }

        delete data.created;

        delete data.updated;

        if (mode === 'create') {

//            if (empty($data['shortname']) && !empty($data['name'])) {
//
//                $data['shortname'] = Urlizer::urlizeTrim($data['name']);
//            }
        }

        if (data.config === null) {

            delete data.config;
        }

        return data;
    },
    // getValidators: function (mode = null, id) {
    //     return new Collection({
    //         id: new Optional(),
    //         firstName: new Required([
    //             new NotBlank(),
    //             new Length({max: 50}),
    //         ]),
    //         lastName: new Required([
    //             new NotBlank(),
    //             new Length({max: 50}),
    //         ]),
    //         email: new Required(new Email()),
    //         password: new Required([
    //             new NotBlank(),
    //             new Length({min: 8 ,max: 50}),
    //         ]),
    //         enabled: new Required(new Type('boolean')),
    //         roles: new Required([
    //             new Count({min: 1}),
    //             new All(new Type('integer'))
    //         ]),
    //         config: new Optional(),
    //     });
    // },
}, table, id);