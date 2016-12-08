/**
 * Created by joao.bruno on 03/09/2014.
 */

var extend = require('extend');

// MODULES
// =============================================================================
var console = require('../lib/console')("MYSQL_QUERIES");
// =============================================================================

// MYSQL INITIALIZATION
// =============================================================================
var mysql = require('mysql');
var mysqlUtils = require('./mysql-utils');
var mysqlPools = require('./mysql-pools');
// =============================================================================

var semaphores = [];

var MysqlQueries = function () {
};

/**
 * MySql Select Query
 *
 * @param what {Object} columns to be selected. For format reference, look at function "buildWhatString" in mysql-utils
 * @param where {Object} parameters to filter rows. For format reference, look at function "buildWhereString" in mysql-utils
 * @param join {Object} tables to be joined to main table. For format reference, look at function "buildJoinString" in mysql-utils
 * @param options {Object} additional options to query. For possible options and format reference, look at function "buildOptions" in mysql-utils
 * @param table {String} table name
 * @param poolName {String} type of database. To possible values, please refer to "Constants" library
 * @param cb {Function} callback function. Structure = function(err,results){}
 */
MysqlQueries.select_query = function (what, where, join, options, table, poolName, cb) {

    function deadCb() {
        return MysqlQueries.select_query(what, where, join, options, table, poolName, cb);
    }

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        var whatString = mysqlUtils.buildWhatString(what);
        var whereString = mysqlUtils.buildWhereString(where);
        var joinString = mysqlUtils.buildJoinString(join);
        if (whatString == "*") {
            whatString = mysqlUtils.buildWhatJoinString(table, join);
        }
        var optionsString = mysqlUtils.buildOptions(options);

        var distinctString = "";

        if(options && options.distinct == true) {
            distinctString = " DISTINCT ";
        }

        // Builds the Query
        var query = "SELECT " + distinctString + whatString + " FROM " + table + joinString +
            (whereString != "" ? " WHERE " + whereString : "") + " " + optionsString;

        console.debug(query);
        
        mysqlPool.query(query, function (err, results) {
            return treatDeadLock(err, deadCb, function() {
                if (err) {
                    return cb(err);
                }

                return cb(null, results);
            });
        });
    });

};

MysqlQueries.select_object_query = function (select_object, poolName, cb) {

    function deadCb() {
        return MysqlQueries.select_object_query(select_object, poolName, cb);
    }

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    }

    if(!select_object) {
        return cb("Select Object Not Defined");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        // Builds the Query String
        var query = mysqlUtils.buildSelectString(select_object);

        console.debug(query);

        mysqlPool.query(query, function (err, results) {
            return treatDeadLock(err, deadCb, function () {
                if (err) {
                    return cb(err);
                }

                return cb(null, results);
            });
        });
    });
};

/**
 * Inserts an object or an array into a table
 *
 * @param object {Object|Array} Values to be inserted into table
 * @param table {String} table name
 * @param poolName {String} type of database. To possible values, please refer to "Constants" library
 * @param cb {Function} callback function. Structure = function(err,inserted_id)
 */
MysqlQueries.insert_query = function (object, table, poolName, cb) {

    function deadCb() {
        return MysqlQueries.insert_query(object, table, poolName, cb);
    }

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    } else if (!object) {
        return cb("Object to be inserted is null, undefined or empty");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        // Formats the given object in Insert format.
        var columns = [];
        var arrayCounter = 0;
        var rowToInsert = "";

        // Avoid ER_NET_PACKET_TOO_LARGE error (Message Max 1Mb)
        var valuesArray = [];
        valuesArray[arrayCounter] = "";

        var isSingle = false;

        if (object instanceof Array) {

            for (var i = 0; i < object.length; i++) {

                if (valuesArray[arrayCounter] != "") {
                    valuesArray[arrayCounter] = valuesArray[arrayCounter] + ",";
                }

                rowToInsert = mysqlUtils.buildRowToInsert(object[i]);

                columns = rowToInsert.columns;
                valuesArray[arrayCounter] = valuesArray[arrayCounter] + rowToInsert.rowString;

                if (i != 0 && i % 100 == 0) {
                    valuesArray.push(valuesArray[arrayCounter]);
                    arrayCounter++;
                    valuesArray[arrayCounter] = "";
                }
            }

        } else {

            isSingle = true;

            rowToInsert = mysqlUtils.buildRowToInsert(object);

            columns = rowToInsert.columns;
            valuesArray[arrayCounter] = rowToInsert.rowString;

            valuesArray.push(valuesArray[arrayCounter]);

        }

        if (isSingle) {
            var query = "INSERT INTO " + table + " (??) VALUES " + valuesArray[0];
            var inserts = [columns];
            query = mysql.format(query, inserts);

            console.debug(query);

            mysqlPool.query(query, function (err, result) {
                return treatDeadLock(err, deadCb, function () {
                    if (err) {
                        return cb(err);
                    }

                    return cb(null, result.insertId);
                });
            });
        } else {
            var queriesCountErr = 0;
            var queriesCountSuc = 0;

            for (var j = 0; j < valuesArray.length; j++) {
                if (valuesArray[j] != "") {
                    insertMultiple("insert", table, valuesArray[j], columns, mysqlPool, 5, 1, function (err, values) {
                        if (err) {
                            queriesCountErr++;
                            console.error("[MYSQL_QUERIES] Could not insert values in table " + table + ": " + values);
                            console.error(err);
                            if (queriesCountErr + queriesCountSuc >= valuesArray.length) {
                                return cb(null);
                            }
                        } else {
                            queriesCountSuc++;
                            if (queriesCountErr + queriesCountSuc >= valuesArray.length) {
                                return cb(null);
                            }
                        }

                    });
                }
            }
        }
    });
};

MysqlQueries.replace_query = function (object, table, poolName, cb) {

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    } else if (!object) {
        return cb("Object to be inserted/replaced is null, undefined or empty");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        // Formats the given object in Insert format.
        var columns = [];
        var arrayCounter = 0;
        var rowToInsert = "";

        // Avoid ER_NET_PACKET_TOO_LARGE error (Message Max 1Mb)
        var valuesArray = [];
        valuesArray[arrayCounter] = "";

        if (object instanceof Array) {

            for (var i = 0; i < object.length; i++) {

                if (valuesArray[arrayCounter] != "") {
                    valuesArray[arrayCounter] = valuesArray[arrayCounter] + ",";
                }

                rowToInsert = mysqlUtils.buildRowToInsert(object[i]);

                columns = rowToInsert.columns;
                valuesArray[arrayCounter] = valuesArray[arrayCounter] + rowToInsert.rowString;

                if (i != 0 && i % 100 == 0) {
                    valuesArray.push(valuesArray[arrayCounter]);
                    arrayCounter++;
                    valuesArray[arrayCounter] = "";
                }
            }

        } else {

            rowToInsert = mysqlUtils.buildRowToInsert(object);

            columns = rowToInsert.columns;
            valuesArray[arrayCounter] = rowToInsert.rowString;

            valuesArray.push(valuesArray[arrayCounter]);

        }

        var queriesCountErr = 0;
        var queriesCountSuc = 0;

        for (var j = 0; j < valuesArray.length; j++) {
            if (valuesArray[j] != "") {
                insertMultiple("replace", table, valuesArray[j], columns, mysqlPool, 5, 1, function (err, values) {
                    if (err) {
                        queriesCountErr++;
                        console.error("Could not insert values in table " + table + ": " + values);
                        console.error(err);
                        if (queriesCountErr + queriesCountSuc >= valuesArray.length) {
                            return cb(null);
                        }
                    } else {
                        queriesCountSuc++;
                        if (queriesCountErr + queriesCountSuc >= valuesArray.length) {
                            return cb(null);
                        }
                    }

                });
            } else {
                queriesCountSuc++;
                if (queriesCountErr + queriesCountSuc >= valuesArray.length) {
                    return cb(null);
                }
            }
        }
    });
};

/**
 * Updates table [table] corresponding to [where] attributes with [set] values, and calls [cb] function with number of
 * affected rows
 *
 * @param set {Object} Values to update in the table
 * @param where {Object} Description of lines that need to be updated
 * @param table {String} Table that will be updated
 * @param poolName {String} Database
 * @param cb {Function} Callback function
 */
MysqlQueries.update_query = function (set, where, table, poolName, cb) {

    function deadCb() {
        return MysqlQueries.update_query(set, where, table, poolName, cb);
    }

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    } else if (!set) {
        return cb("No parameters to be updated were informed (\"set\" object is null, undefined or empty).");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        var setString = mysqlUtils.buildSetString(set);
        var whereString = mysqlUtils.buildWhereString(where);

        var query = "UPDATE " + table + " SET " + setString + " WHERE " + whereString;
        console.debug(query);

        mysqlPool.query(query, function (err, result) {
            return treatDeadLock(err, deadCb, function () {
                if (err) {
                    return cb(err);
                }

                return cb(null, result.changedRows);
            });
        })
    });
};

MysqlQueries.insert_duplicate_query = function (fields, values, onDuplicateFields, table, poolName, cb) {

    function deadCb() {
        return MysqlQueries.insert_duplicate_query(fields, values, onDuplicateFields, table, poolName, cb);
    }

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    } else if(!(values instanceof Array)) {
        return cb("values is not an array!")
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        var arrayCounter = 0;
        var valuesArray = [];

        valuesArray[arrayCounter] = "";

        for (var i = 0; i < values.length; i++) {

            var rowToInsert = "(";
            for (var j = 0; j < fields.length; j++) {
                rowToInsert = rowToInsert + (values[i][fields[j]] ? "'" + mysqlUtils.escapeString(values[i][fields[j]]) + "'" : 'null');
                if(fields.length - j > 1) {
                    rowToInsert = rowToInsert + ",";
                }
            }
            rowToInsert = rowToInsert + ")";

            valuesArray[arrayCounter] = valuesArray[arrayCounter] + (valuesArray[arrayCounter] == "" ? "" : ",") + rowToInsert;

            if (i != 0 && i % 1000 == 0) {
                valuesArray.push(valuesArray[arrayCounter]);
                arrayCounter++;
                valuesArray[arrayCounter] = "";
            }
        }

        var fieldValue = "(";
        for (var i = 0; i < fields.length; i++) {
            fieldValue = fieldValue + fields[i];
            if(fields.length - i > 1) {
                fieldValue = fieldValue + ",";
            }
        }
        fieldValue = fieldValue + ")";

        var onDuplicateFieldsValue = "";
        for (var i = 0; i < onDuplicateFields.length; i++) {
            onDuplicateFieldsValue = onDuplicateFieldsValue + onDuplicateFields[i] + "=VALUES(" + onDuplicateFields[i] + ")";
            if(onDuplicateFields.length - i > 1) {
                onDuplicateFieldsValue = onDuplicateFieldsValue + ",";
            }
        }

        var counter = 0;

        function insertUpdate(cont) {

            if (semaphores[table] == undefined) {
                semaphores[table] = require('semaphore')(1);
            }

            semaphores[table].take(function () {
                var query = "INSERT INTO " + table + " " + fieldValue + " VALUES " + valuesArray[cont] + " ON DUPLICATE KEY UPDATE " + onDuplicateFieldsValue;
                console.debug(query);
                mysqlPool.query(query, function (err, result) {
                    semaphores[table].leave();
                    return treatDeadLock(err, deadCb, function () {
                        counter++;

                        if (err) {
                            console.error(err);
                        }

                        if(counter >= arrayCounter) {
                            return cb(null);
                        }
                    });
                });
            });
        }

        arrayCounter++;

        for (var i = 0; i < arrayCounter; i++) {
            insertUpdate(i);
        }
    });
};

/**
 * Transaction that tries to update table, and if fails try to insert values into table
 *
 * @param set
 * @param where
 * @param table
 * @param poolName
 * @param cb
 */
MysqlQueries.update_insert_query = function (set, where, table, poolName, cb) {

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    } else if (!set) {
        return cb("No parameters to be updated/inserted were informed (\"set\" object is null, undefined or empty).");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        var setString = mysqlUtils.buildSetString(set);
        var whereString = mysqlUtils.buildWhereString(where);

        var selectAllObject = set;

        extend(true, selectAllObject, where);

        delete selectAllObject.typof;

        var selectAllString = mysqlUtils.buildSelectAllString(selectAllObject);

        var query = "";

        mysqlPool.getConnection(function (err, connection) {
            if (err) {
                if (connection.release) connection.release();
                return cb(err);
            }

            connection.beginTransaction(function (err) {
                if (err) {
                    connection.release();
                    return cb(err);
                }

                query = "UPDATE " + table + " SET " + setString + " WHERE " + whereString + "; ";
                console.debug(query);

                connection.query(query, function (err, result1) {
                    if (err) {
                        connection.rollback(function () {
                            connection.release();
                            return cb(err);
                        });
                        return;
                    }

                    if (result1.affectedRows >= 1) {
                        connection.commit(function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    return cb(err);
                                });
                            } else {
                                connection.release();
                                return cb(null);
                            }
                        });
                        return;
                    }

                    query = "INSERT INTO " + table + " (??) " +
                    "SELECT " + selectAllString +
                    " FROM dual WHERE NOT EXISTS " +
                    "( SELECT * FROM " + table + " WHERE " + whereString + "); ";
                    var inserts = [mysqlUtils.getColumnNames(selectAllObject)];

                    query = mysql.format(query, inserts);

                    console.debug(query);

                    connection.query(query, function (err, result2) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                return cb(err);
                            });
                            return;
                        }

                        connection.commit(function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    return cb(err);
                                });
                            } else {
                                connection.release();
                                return cb(null);
                            }
                        });
                    });
                });
            });
        });
    });
};

/**
 * Mysql Delete Query
 *
 * @param where {Object} Filters which elements must be deleted
 * @param table {String} table name
 * @param poolName {String} type of database. To possible values, please refer to "Constants" library
 * @param cb {Function} callback function. Structure = function(err,affected_rows)
 */
MysqlQueries.delete_query = function (where, table, poolName, cb) {

    function deadCb() {
        return MysqlQueries.delete_query(where, table, poolName, cb);
    }

    if (!poolName || poolName == "") {
        return cb("PoolName must be specified.");
    } else if (!table || table == "") {
        return cb("Table name must be specified");
    } else if (!where) {
        return cb("No parameters to filter delete action were informed (\"where\" object is null, undefined or empty).");
    }

    selectDB(poolName, function(err, mysqlPool) {

        if (err || mysqlPool == undefined) {
            return cb("Pool Name " + poolName + " does not exist. Please specify a new poolName through function \"AddCredential\"");
        }

        var whereString = mysqlUtils.buildWhereString(where);

        var query = "DELETE FROM " + table + " WHERE " + whereString;
        console.debug(query);

        mysqlPool.query(query, function (err, result) {
            return treatDeadLock(err, deadCb, function () {
                if (err) {
                    return cb(err);
                }
                console.debug(result.affectedRows + ' elements deleted from ' + table);
                return cb(null, result.affectedRows);
            });
        })
    });
};

/**
 * Returns the mysql pool of connections, corresponding to the type of database passed.
 *
 * @param poolName {String} type of database.
 * @param cb {Function} callback.
 */
function selectDB(poolName, cb) {
    mysqlPools.getMysqlPool(poolName,function(err, pool) {
        return cb(err, pool);
    });
}

function insertMultiple(query_type, table, values, columns, mysqlPool, max_attempts, attempt, cb) {

    var queryStruct = "";

    if (query_type.toLowerCase() == "replace") {
        queryStruct = "REPLACE INTO " + table + " (??) VALUES ";
    } else if (query_type.toLowerCase() == "insert") {
        queryStruct = "INSERT INTO " + table + " (??) VALUES ";
    } else {
        cb("Unknown query_type. Please use \"replace\" or \"insert\"");
    }

    var inserts = [columns];

    if (semaphores[table] == undefined) {
        semaphores[table] = require('semaphore')(1);
    }

    semaphores[table].take(function () {
        var query = queryStruct + values;
        query = mysql.format(query, inserts);

        console.debug(query);

        mysqlPool.query(query, function (err, result) {
            semaphores[table].leave();
            if (err) {
                if(attempt <= max_attempts) {
                    insertMultiple(query_type, table, values, columns, mysqlPool, max_attempts, attempt + 1, cb);
                } else {
                    return cb(err, values);
                }
            } else {
                return cb(null);
            }
        });
    });
}

function treatDeadLock(err, deadCb, cb) {
    if(err && err.code === "ER_LOCK_DEADLOCK") {
        return deadCb();
    } else {
        return cb();
    }
}

module.exports = MysqlQueries;