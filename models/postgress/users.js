const abstract = require("knex-abstract");

const extend = abstract.extend;

const prototype = abstract.prototype_common;

const log = require("inspc");

const isObject = require("nlab/isObject");

module.exports = (knex) =>
  extend(
    knex,
    prototype,
    {
      initial: async function () {
        const id = await this.raw(
          `
select r.id from roles r where r.name = ?
`,
          ["user"]
        ).then((role) => {
          try {
            return role[0][0].id;
          } catch (e) {}
        });

        const roles = [];

        if (id) {
          roles.push(id);
        }

        return {
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          enabled: false,
          roles,
        };
      },
      fromDb: async function (opt, rows) {
        const tmp = [];

        let i = -1;
        for (const row of rows) {
          i += 1;

          if (opt.test1) {
            delete row.created;

            delete row.updated;

            delete row.id;

            if (!opt.created) {
              (opt.created = true),
                await abstract("pg").model.users.insert(
                  {
                    trx: opt.trx,
                  },
                  {
                    firstName: opt.test1,
                    lastName: "test",
                    password: "psw",
                    email: "emailfdsafds",
                  }
                );
            }

            row.extraFromDb = true;

            tmp.push(row);

            return tmp;
          }

          if (typeof row.roles === "string") {
            row.roles = row.roles.split(",").map((r) => (/^\d+$/.test(r) ? parseInt(r, 10) : r));
          }

          if (!Array.isArray(row.roles)) {
            row.roles = [];
          }

          if (typeof row.enabled !== "undefined") {
            row.enabled = !!row.enabled;
          }

          if (typeof row.config === "string") {
            try {
              row.config = JSON.parse(row.config);
            } catch (e) {
              row.config = {};
            }
          }

          tmp.push(row);
        }

        return tmp;
      },
      toDb: async function (opt, row) {
        if (!isObject(row)) {
          return row;
        }

        if (opt.test1) {
          row.lastName = "test1-lastName";
        }

        if (typeof row.roles !== "undefined") {
          delete row.roles;
        }

        if (typeof row.created !== "undefined") {
          delete row.created;
        }

        if (typeof row.updated !== "undefined") {
          delete row.updated;
        }

        if (!row.config) {
          delete row.config;
        }

        if (typeof row.config !== "undefined" && typeof row.config !== "string") {
          row.config = JSON.stringify(row.config, null, 4);
        }

        return row;
      },
      update: function (opt, entity, id) {
        if (Array.isArray(entity.roles)) {
          this.updateRoles(opt, id, entity.roles);
        }

        return prototype.prototype.update.call(this, opt, entity, id);
      },
      insert: async function (opt, entity) {
        let roles = null;

        if (Array.isArray(entity.roles)) {
          roles = entity.roles;
        }

        entity = await this.toDb(opt, Object.assign({}, entity));

        const id = await prototype.prototype.insert.call(this, opt, entity);

        if (roles) {
          await this.updateRoles(opt, id, roles);
        }

        return id;
      },
      delete: async function (id, ...args) {
        await this.clearRoles(id);

        return await prototype.prototype.delete.call(this, id, ...args);
      },
      updateRoles: async function (opt, userId, rolesIds) {
        await this.clearRoles(userId);

        if (Array.isArray(rolesIds)) {
          return await Promise.all(
            rolesIds.map(async (role_id) => {
              return await knex.model.user_role.insert(opt, {
                user_id: userId,
                role_id,
              });
            })
          );
        }
      },
      clearRoles: async function (opt, userId) {
        return await this.query(opt, `delete from user_role where user_id = :id`, userId);
      },
      prepareToValidate: function (data = {}, mode) {
        if (typeof data.id !== "undefined") {
          delete data.id;
        }

        delete data.created;

        delete data.updated;

        if (mode === "create") {
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
    },
    "users",
    "id"
  );
