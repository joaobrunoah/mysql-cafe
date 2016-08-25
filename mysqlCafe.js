/**
 * Created by joao.bruno on 24/08/2016.
 */
var MysqlCredentials = require("./mysql/mysql-credentials");
var MysqlQueries = require("./mysql/mysql-queries");
var MysqlUtils = require("./mysql/mysql-utils");
var Console = require("./lib/console");

var MysqlCafe = function(DEBUG_MODE) {

    Console.DEBUGMODE = true;
    // if(DEBUG_MODE) {
    //     Console.DEBUGMODE = true;
    // }
};

MysqlCafe.addCredentials = function(poolName, credentials) {
    MysqlCredentials.addCredential(poolName,credentials);
};

MysqlCafe.query = MysqlQueries;

MysqlCafe.savedCredentials = MysqlCredentials.savedCredentials;

MysqlCafe.utils = MysqlUtils;

module.exports = MysqlCafe;