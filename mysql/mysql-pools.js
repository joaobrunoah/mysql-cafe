/**
 * Created by joao.bruno on 30/10/2014.
 */

var mysql = require('mysql');
var mysqlCredentials = require('./mysql-credentials.js');

var console = require('../lib/console')('MYSQL_POOL');

var mysqlPoolsArray = {};

var MysqlPools = {};
MysqlPools.getMysqlPool = function (poolName, cb) {

    var credentials = mysqlCredentials.savedCredentials[poolName];

    if (credentials == "undefined" || credentials == undefined || credentials == null) {
        return cb("Pool Name does not exist.")
    }

    if(!mysqlPoolsArray[poolName]) {
        mysqlPoolsArray[poolName] = mysql.createPool(credentials);
        return cb(null,mysqlPoolsArray[poolName]);
    } else {

        function returnNewPool() {
            if(mysqlPoolsArray[poolName]) {
                try {
                    mysqlPoolsArray[poolName].end();
                } catch (err) {
                
                }
            }
            mysqlPoolsArray[poolName] = mysql.createPool(credentials);
            return cb(null,mysqlPoolsArray[poolName]);
        }

        try {
            mysqlPoolsArray[poolName].getConnection(function(err, connection) {
                if(err) {
                    returnNewPool();
                }

                if(connection !== null && connection !== undefined) {
                    mysqlPoolsArray[poolName].releaseConnection(connection);
                } else {
                    returnNewPool();
                }

                return cb(null,mysqlPoolsArray[poolName]);

            });

        } catch(err) {
            returnNewPool();
        }

    }

};

module.exports = MysqlPools;