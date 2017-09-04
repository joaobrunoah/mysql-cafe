/**
 * Created by joao.bruno on 03/10/2014.
 */

function MysqlGreaterThan(param){
    this.param = param;
}

MysqlGreaterThan.prototype.mountWhere = function(variable){
    var mysqlUtils = require('./mysql-utils');
    return variable + " > " + this.param;
};

module.exports = MysqlGreaterThan;