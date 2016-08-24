/**
 * Created by joao.bruno on 03/03/2015.
 * Modified by Bruno Pinho on 10/12/2015
 *  Added the SELECT option inside IN statement
 */

var mysqlUtils = require('./mysql-utils');

function MysqlInArray(array){
    if(array instanceof Array) {
        this.array = array;
    }
    else if (array instanceof Object) {
        this.array = array;
    }
    else {
        this.array = [];
    }
}

MysqlInArray.prototype.mountWhere = function(variable){
    //variable = mysqlUtils.escapeString(variable);
    // if array is Object, it has a SELECT
    //if (this.array instanceof Object) {
    if (Object.prototype.toString.call(this.array) === '[object Object]') {
        return variable + " IN (" + mysqlUtils.buildSelectString(this.array) + " )";
    }

    else { // it is a common array
        var values = "";

        for (var i = 0; i < this.array.length; i++) {
            if(values === "") {
                values = "(";
            } else {
                values += ",";
            }

            values = values + "'" + this.array[i] + "'";

        }

        if(values === ""){
            return "";
        }

        values += ")";

        return variable + " IN " + values;
    }
};

module.exports = MysqlInArray;
