
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
            host        : process.env.MYSQL_HOST,
            port        : process.env.MYSQL_PORT,
            user        : process.env.MYSQL_USER,
            password    : process.env.MYSQL_PASS,
            database    : process.env.MYSQL_DB,
            multipleStatements: true,
        },
        models: mysql,
    },
};