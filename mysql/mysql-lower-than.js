/**
 * Created by joao.bruno on 03/10/2014.
 */

function MysqlLowerThan(param){
    this.param = param;
}

MysqlLowerThan.prototype.mountWhere = function(variable){
    return variable + " < '" + this.param + "'";
};

module.exports = MysqlLowerThan;