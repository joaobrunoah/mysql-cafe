/**
 * Created by joao.bruno on 24/08/2016.
 */

// First, instantiate Console and debug mode. It will be used by next libraries
var Console = require("./lib/console");

var MysqlCafe = function(DEBUG_MODE) {

    if(DEBUG_MODE) {
         Console.DEBUGMODE = true;
    }

    return MysqlCafe;
};

Console.DEBUGMODE = true;

// Mysql Local Libraries
var MysqlCredentials = require("./mysql/mysql-credentials");
var MysqlQueries = require("./mysql/mysql-queries");
var MysqlUtils = require("./mysql/mysql-utils");

// Functions
var MysqlInArray = require("./mysql/mysql-inArray");

MysqlCafe.addCredentials = function(poolName, credentials) {
    MysqlCredentials.addCredential(poolName,credentials);
};

MysqlCafe.query = MysqlQueries;

MysqlCafe.functions = {
    inArray: MysqlInArray
};

MysqlCafe.savedCredentials = MysqlCredentials.savedCredentials;

MysqlCafe.utils = MysqlUtils;

module.exports = MysqlCafe;