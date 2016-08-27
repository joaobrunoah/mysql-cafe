/**
 * Created by joao.bruno on 04/09/2014.
 */

var moment = require('moment-timezone');
var mysql = require('mysql');

var mysqlInterval = require('./mysql-interval');
var mysqlTimestamp = require('./mysql-timestamp');

var MysqlUtils = function () {
};

MysqlUtils.DIRECTION_RIGHT = "RIGHT";
MysqlUtils.DIRECTION_LEFT = "LEFT";
MysqlUtils.DIRECTION_INNER = "INNER";

MysqlUtils.WHERE_NOT_NULL = "NOT NULL";

MysqlUtils.OPERATOR = {
    AND : "AND",
    OR  : "OR"
};

MysqlUtils.buildSelectString = function (object) {
    if(!object.from) {
        throw new Error("Parameter 'from' not found in object select!")
    }

    if(object.from && object.from.isSelect && !object.from.alias) {
        throw new Error("Parameter 'from' is a new Select, and every inner select must have parameter 'alias'!");
    }

    var whatString = "*";
    var whereString = "";
    var optionsString = "";
    var distinctString = "";
    var fromString = "";

    if(object.what) {
        whatString = MysqlUtils.buildWhatString(object.what);
    }

    if(object.where) {
        whereString = MysqlUtils.buildWhereString(object.where);
    }

    if(object.options) {
        optionsString = MysqlUtils.buildOptions(object.options);

        if(object.options.distinct == true) {
            distinctString = " DISTINCT ";
        }

    }

    if(object.from && !object.from.isSelect) {
        var joinString = MysqlUtils.buildJoinString(object.from.join);

        var tableString = object.from.table;
        var tableName = object.from.table;

        if(object.from.table.isSelect) {
            tableString = MysqlUtils.buildSelectString(object.from.table);
        }

        if (whatString == "*") {
            if(object.from.table.isSelect) {
                tableName = object.from.table.alias;
            }
            whatString = MysqlUtils.buildWhatJoinString(tableName, object.from.join);
        }

        fromString = tableString + joinString;
    } else {
        fromString = MysqlUtils.buildSelectString(object.from);
    }

    var unionString = "";

    if(object.union) {

        var union_obj = object.union;

        if((union_obj instanceof Array) && union_obj.length > 0) {

            for (var i = 0; i < union_obj.length; i++) {

                if(union_obj[i].isSelect) {
                    var union_select = MysqlUtils.buildSelectString(union_obj[i]);
                    unionString = unionString + " UNION " + union_select;
                }
            }

        } else if (!(union_obj instanceof Array) && union_obj.isSelect) {
            var union_select = MysqlUtils.buildSelectString(union_obj);
            unionString = unionString + " UNION " + union_select;
        }
    }

    var query = "(SELECT " + distinctString + whatString + " FROM " + fromString +
        (whereString != "" ? " WHERE " + whereString : "") + " " + optionsString + ")" + unionString;

    if(object.alias) {
        query = "(" + query + ") as " + object.alias;
    }

    // Builds the Query
    return query;
};

/**
 * Builds a string to be used in WHERE clauses in mysql
 *
 * @param object
 * @returns {string}
 */
MysqlUtils.buildWhereString = function (object) {
    var objectString = "";

    if(object instanceof Array) {
        for(var i = 0; i < object.length; i++) {
            if(objectString !== "") {
                objectString = objectString + " OR ";
            }
            objectString = objectString + "(" + MysqlUtils.buildWhereString(object[i]) + ")";
        }
    } else if (object.hasOwnProperty("operator") && object.hasOwnProperty("whereArray")) {
        var whereArray = object.whereArray;
        var operator = object.operator;

        for(var i = 0; i < whereArray.length; i++) {
            var whereFromObject = MysqlUtils.buildWhereString(whereArray[i]);
            if(whereFromObject !== "") {
                if (objectString !== "") {
                    objectString = objectString + " " + operator + " ";
                }
                objectString = objectString + "(" + whereFromObject + ")";
            }
        }
    } else {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                if (!isFunction(object[key])) {

                    if (object[key] != null && object[key] != undefined && object[key].mountWhere != undefined) {
                        pairString = object[key].mountWhere(key);
                    } else if (!object[key] || object[key] === null) {
                        pairString = key + "=null";
                    } else if (object[key] === MysqlUtils.WHERE_NOT_NULL) {
                        pairString = key + " IS NOT NULL";
                    } else if (object[key] instanceof Array) {
                        pairString = "";
                        for (var i = 0; i < object[key].length; i++) {
                            if(pairString !== "") {
                                pairString = pairString + " AND ";
                            }
                            var objWhere = {};
                            objWhere[key] = object[key][i];
                            pairString = pairString + MysqlUtils.buildWhereString(objWhere);
                        }
                        pairString = "(" + pairString + ")";
                    } else if (object[key].isSelect) {
                        pairString = key + " in " + MysqlUtils.buildSelectString(object[key]);
                    } else {
                        var pairString = key + '=' + formatParam(object[key])
                    }

                    if(pairString !== "") {
                        if (objectString == "") {
                            objectString = pairString;
                        } else {
                            objectString = objectString + " AND " + pairString;
                        }
                    }
                }
            }
        }
    }
    if(objectString === "()") {
        objectString = "";
    }

    return objectString;
};

/**
 * Builds a string to be used in SET clauses in mysql
 *
 * @param object
 * @returns {string}
 */
MysqlUtils.buildSetString = function (object) {
    var objectString = "";

    for (var key in object) {
        if(object.hasOwnProperty(key)) {
            var pairString = key + '=' + formatParam(object[key]);
            if (object[key] != null && object[key] != undefined && object[key].mountSet != undefined) {
                pairString = object[key].mountSet(key);
            } else if (object[key] == null) {
                pairString = key + "=null";
            } else if (object[key].match && object[key].match(/\+1/) != null) {
                pairString = key + '=' + key + " + 1";
            }

            if (objectString == "") {
                objectString = pairString;
            } else {
                objectString = objectString + "," + pairString;
            }
        }
    }
    return objectString;
};

MysqlUtils.buildJoinString = function (join) {

    if (!join || join.length <= 0) {
        return "";
    }

    var joinString = "";

    for (var i = 0; i < join.length; i++) {
        var joinObj = join[i];
        var direction = MysqlUtils.DIRECTION_INNER;
        if(joinObj.direction) {
            direction = joinObj.direction;
        }

        if(joinObj.table.isSelect) {
            joinString = joinString + " " + direction + " JOIN " + MysqlUtils.buildSelectString(joinObj.table) + " ON " + joinObj.joinRule;
        } else {
            joinString = joinString + " " + direction + " JOIN " + joinObj.table + " ON " + joinObj.joinRule;
        }
    }
    return joinString;
};

MysqlUtils.buildWhatJoinString = function (table, join) {
    var whatJoinString = "";

    for (var i = 0; i < join.length; i++) {
        var joinObj = join[i];
        whatJoinString += joinObj.table + ".*,";
    }

    if (whatJoinString == "") {
        whatJoinString = table + ".*";
    } else {
        whatJoinString += table + ".*";
    }
    return whatJoinString;
};

MysqlUtils.convertToTimestamp = function (dateString) {
    return moment(new Date(dateString)).format("YYYY-MM-DD HH:mm:ss");
};

MysqlUtils.buildSelectAllString = function (object) {
    var selectAllString = "";

    for (var key in object) {
        if(object.hasOwnProperty(key)) {
            if (selectAllString != "") {
                selectAllString += ",";
            }

            if (object[key] != null && object[key] != undefined && object[key].mountSelectAll != undefined) {
                selectAllString += object[key].mountSelectAll(key);
            } else if(object[key] && object[key].match && object[key].match(/\+1/) != null) {
                selectAllString += "'1' as " + key;
            } else {
                selectAllString += formatParam(object[key]) + " as " + key;
            }
        }
    }

    return selectAllString;
};

MysqlUtils.buildWhatString = function (what) {
    var whatString = "";

    if(what) {
        for (var i = 0; i < what.length; i++) {
            if (whatString != "") {
                whatString += ",";
            }

            if (what[i] !== null && what[i] !== undefined && what[i].mountWhat !== undefined) {
                whatString += what[i].mountWhat();
            } else {
                whatString += what[i];
            }
        }
        if (whatString == "") {
            whatString = "*";
        }
    } else {
        whatString = "*";
    }

    return whatString;
};

MysqlUtils.buildOptions = function (options) {

    var query = "";

    if (options.groupBy) {
        query = query + " GROUP BY ";

        var groupByString = "";

        function insertElement(element, string) {
            if(string !== "") {
                string += ",";
            }
            if(element instanceof String) {
                string += mysqlUtils.formatParam(element);
            } else {
                string += element;
            }

            return string;
        }

        if(options.groupBy instanceof Array) {
            for (var i = 0; i < options.groupBy.length; i++) {
                var element = options.groupBy[i];
                groupByString = insertElement(element,groupByString);
            }
        } else {
            groupByString = insertElement(options.groupBy,groupByString);
        }

        query += groupByString;
    }

    if (options.orderBy) {
        if(options.orderBy instanceof Array) {

            query = query + " ORDER BY ";

            for(var i = 0; i < options.orderBy.length; i++) {
                if(i > 0) {
                    query = query + ",";
                }

                var orderBy_obj = options.orderBy[i];

                query = query + orderBy_obj["parameter"];
                if(orderBy_obj["desc"]) {
                    query = query + " desc";
                }
            }

        } else { //TODO ELSE IS DEPRECATED.
            query = query + " ORDER BY " + options.orderBy;

            if (options.desc) {
                query = query + " desc ";
            }
        }
    }

    if (options.limit > 0) {
        query = query + " LIMIT " + options.limit;
    }

    if (options.offset > 0) {
        query = query + " OFFSET " + options.offset;
    }

    return query;
};

MysqlUtils.buildRowToInsert = function(object) {
    var columns = MysqlUtils.getColumnNames(object);

    var row = "";

    for (var j = 0; j < columns.length; j++) {
        var column = columns[j];

        var value = formatParam(object[column]);

        if (row == "") {
            row = "(" + value;
        } else {
            row = row + "," + value;
        }
    }

    row = row + ")";

    return {
        rowString : row,
        columns : columns
    }
};

/**
 * Returns an array with all object parameter names (column names)
 *
 * @param object {Object} Object which parameters are columns of a MySql table
 * @returns {Array}
 */
MysqlUtils.getColumnNames = function(object) {

    var columns = [];

    for (var key in object) {
        // key can refer to inherited properties
        if(object.hasOwnProperty(key)) {
            columns.push(key);
        }
    }

    return columns;
}

MysqlUtils.escapeString = function(str){
    if (typeof str != 'string') str = str.toString();

    return str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
                return '\\"';
            case "\'":
                return "\\'";
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
};

MysqlUtils.mountTimestampInterval = function(startDate, endDate){

    var DATE_FORMAT = "YYYYMMDDHH";

    var startInterval = moment('1970010100',DATE_FORMAT);
    var endInterval = moment(); // now

    if(startDate) {
        if (startDate instanceof String && startDate.length !== 8)
            return cb("Dates must be in format 'YYYYMMDDHH'");
        else
            startInterval = moment(startDate, DATE_FORMAT);
    }

    if(endDate) {
        if (endDate instanceof String && endDate.length !== 8)
            return cb("Dates must be in format 'YYYYMMDDHH'");
        else
            endInterval = moment(endDate,DATE_FORMAT);
    }

    if(endInterval.isBefore(startInterval)) {
        return cb("endDate is before startDate");
    }

    var startTimestamp = new mysqlTimestamp(
        startInterval.year().toString(),
        (startInterval.month() + 1).toString(),
        startInterval.date().toString(),
        startInterval.hour().toString(),"00","00").date;
    var endTimestamp = new mysqlTimestamp(
        endInterval.year().toString(),
        (endInterval.month() + 1).toString(),
        endInterval.date().toString(),
        endInterval.hour().toString(), "59","59").date;

    return new mysqlInterval(startTimestamp, endTimestamp);
};

function formatParam(param){
    var ans = param;
    try {

        if(param instanceof Buffer) {
            param = param.toString();
        }
        
        if(param === 'null' || param === null) {
            return null;
        }

        ans = "\'" + param.replace(/'/g, '\'\'') + "\'";
        return ans;
    } catch (err) {
        return "\'" + param + "\'";
    }
}

MysqlUtils.formatParam = formatParam;

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

module.exports = MysqlUtils;