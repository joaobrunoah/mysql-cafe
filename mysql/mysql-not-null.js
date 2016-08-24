/**
 * Created by joao.bruno on 05/02/2015.
 */

function MysqlNotNull(string){
    this.string = string;
}

MysqlNotNull.prototype.mountWhere = function(variable){
    return variable + " IS NOT NULL ";
};

module.exports = MysqlNotNull;