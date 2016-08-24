/**
 * Created by joao.bruno on 03/10/2014.
 */

function MysqlInterval(begin,end){
    this.begin = begin;
    this.end = end;
}

MysqlInterval.prototype.mountWhere = function(variable){
    return variable + " >= '" + this.begin + "' AND " + variable + " <= '" + this.end + "'";
};

module.exports = MysqlInterval;