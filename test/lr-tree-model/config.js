
const mysql = require('./mysql');

module.exports = {
    def: 'mysql',
    mysql: {
        // CREATE DATABASE IF NOT EXISTS `dashboard` /*!40100 DEFAULT CHARACTER SET utf8 */
        // GRANT ALL PRIVILEGES ON dashboard.* To 'dashboard'@'%' IDENTIFIED BY 'pass';
        // SHOW GRANTS FOR 'dashboard';
        // DROP USER 'dashboard'
        client: 'mysql',
        connection: {
            host        : process.env.PROTECTED_MYSQL_HOST,
            port        : process.env.PROTECTED_MYSQL_PORT,
            user        : process.env.PROTECTED_MYSQL_USER,
            password    : process.env.PROTECTED_MYSQL_PASS,
            database    : process.env.PROTECTED_MYSQL_DB,
            multipleStatements: true,
        },
        models: mysql,
    },
};