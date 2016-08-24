/**
 * Created by thiago.machado on 17/09/2015.
 */

function MysqlUppercase(string) {
    this.string = string;
}

MysqlUppercase.prototype.mountWhere = function(variable){
    return "UPPER(" + variable + ") = UPPER(" + this.string + ")";
};

module.exports = MysqlUppercase;