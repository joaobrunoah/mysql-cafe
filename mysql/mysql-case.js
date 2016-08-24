/**
 * Created by Joao on 19/05/2015.
 */

var mysqlUtils = require('./mysql-utils');

function MysqlCase(var_alias){
    this.var_alias = var_alias;
}

MysqlCase.prototype.insertCase = function (singleCase) {

    if(singleCase instanceof MysqlSingleCase) {

        if (!this.caseArray) {
            this.caseArray = [];
        }

        this.caseArray.push(singleCase);
    } else {
        console.error("Argument in insertCase function was not instance of MysqlSingleCase");
    }
};

MysqlCase.prototype.mountWhat = function(){
    if(this.caseArray.length <= 0) {
        return "";
    }

    var caseString = "(CASE ";

    for (var i = 0; i < this.caseArray.length; i++) {
        var isDefault = false;
        if(i == this.caseArray.length - 1) {
            isDefault = true;
        }

        caseString += this.caseArray[i].mountWhat(isDefault) + " ";
    }

    caseString += "end) as " + this.var_alias;

    return caseString;
};

function MysqlSingleCase(variable, condition, value) {
    this.variable = variable;
    this.condition = condition;
    this.value = value;
}

MysqlSingleCase.prototype.mountWhat = function(isDefault){

    if(isDefault) {
        return "ELSE " + this.variable;
    } else {

        var whereObj = {};
        whereObj[this.variable] = this.condition;

        return "WHEN (" + mysqlUtils.buildWhereString(whereObj) + ") THEN " + mysqlUtils.formatParam(this.value);
    }
};

module.exports = {
    MysqlCase : MysqlCase,
    MysqlSingleCase : MysqlSingleCase
};