
const path              = require('path');

const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

module.exports = knex => extend(knex, prototype, {
    initial: async function () {

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

        if (opt.test1) {

            delete row.created;

            delete row.updated;

            delete row.id;

            if ( ! opt.created ) {

                opt.created = true,

                await abstract().model.users.insert(trx, {
                    firstName: opt.test1,
                    lastName: 'test',
                    password: 'psw',
                    email: 'emailfdsafds',
                })
            }


            row.extraFromDb = true;

            return row;
        }

        if (typeof row.roles === 'string') {

            row.roles = row.roles.split(',').map(r => /^\d+$/.test(r) ? parseInt(r, 10) : r);
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

        if (opt.test1) {

            row.lastName = 'test1-lastName';
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

        let [opt, trx, entity] = a(args);

        let roles = null;

        if (Array.isArray(entity.roles)) {

            roles = entity.roles;
        }

        entity = await this.toDb(Object.assign({}, entity), opt, trx);

        const id = await prototype.prototype.insert.call(this, opt, trx, entity);

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
        return await this.query(`delete from user_role where user_id = :id`, userId);
    },
//     find: function (...args) {
//
//         let [opt, trx, id] = a(args);
//
//         if ( ! id ) {
//
//             throw `user.js::find(): id not specified or invalid`;
//         }
//
//         const data = this.raw(opt, trx, `
// SELECT          u.*, GROUP_CONCAT(r.id) roles
// FROM            users u
// LEFT JOIN       user_role ur
// 		     ON ur.user_id = u.id
// LEFT JOIN       roles r
// 		     ON ur.role_id = r.id
// WHERE           u.id = ?
// GROUP BY        u.id
// ORDER BY        id desc
//         `, [id]).then(data => {
//             return data[0][0];
//         }).then(d => this.fromDb(d, opt, trx));
//
//         return data;
//     },
//     findAll: function (...args) {
//
//         let [opt, trx] = a(args);
//
//         const data = this.raw(opt, trx, `
// SELECT          u.*, GROUP_CONCAT(r.name) roles
// FROM            users u
// LEFT JOIN       user_role ur
// 		     ON ur.user_id = u.id
// LEFT JOIN       roles r
// 		     ON ur.role_id = r.id
// GROUP BY        u.id
// ORDER BY        id desc
//         `).then(data => {
//             return data[0];
//         }).then(list => list.map(d => this.fromDb(d, opt, trx)));
//
//         return data;
//     },
    prepareToValidate: function (data = {}, mode) {

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
}, 'users', 'id');