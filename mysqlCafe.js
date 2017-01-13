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
var MysqlGreaterThan = require('./mysql/mysql-greater-than');
var MysqlInArray = require("./mysql/mysql-inArray");
var MysqlNotInArray = require("./mysql/mysql-notInArray");
var MysqlInterval = require("./mysql/mysql-interval");
var MysqlLike = require("./mysql/mysql-like-where");
var MysqlNotNull = require("./mysql/mysql-not-null");
var MysqlNull = require("./mysql/mysql-null");

MysqlCafe.addCredentials = function(poolName, credentials) {
    MysqlCredentials.addCredential(poolName,credentials);
};

MysqlCafe.query = MysqlQueries;

MysqlCafe.functions = {
    greaterThan: MysqlGreaterThan,
    inArray: MysqlInArray,
    notInArray: MysqlNotInArray,
    interval: MysqlInterval,
    like: MysqlLike,
    notNull: MysqlNotNull,
    Null: MysqlNull
};

MysqlCafe.savedCredentials = MysqlCredentials.savedCredentials;

MysqlCafe.utils = MysqlUtils;

module.exports = MysqlCafe;