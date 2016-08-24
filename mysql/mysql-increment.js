/**
 * Created by joao.bruno on 04/03/2015.
 */

function MysqlIncrement(){}

MysqlIncrement.prototype.mountSet = function(variable){
    return variable + " = " + variable + " + 1";
};

MysqlIncrement.prototype.mountSelectAll = function(variable){
    return "'1' as " + variable;
};

module.exports = MysqlIncrement;