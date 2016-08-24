/**
 * Created by joao.bruno on 05/02/2015.
 */

function MysqlNull(string){
    this.string = string;
}

MysqlNull.prototype.mountSet = function(variable){
    return variable + " = null";
};

MysqlNull.prototype.mountWhere = function(variable){
    return variable + " IS NULL ";
};

module.exports = MysqlNull;