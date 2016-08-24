/**
 * Created by joao.bruno on 04/03/2015.
 */

function MysqlDecrement(){}

MysqlDecrement.prototype.mountSet = function(variable){
    return variable + " = " + variable + " - 1";
};

MysqlDecrement.prototype.mountSelectAll = function(variable){
    return "'0' as " + variable;
};

module.exports = MysqlDecrement;