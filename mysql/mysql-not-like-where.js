/**
 * Created by joao.bruno on 05/02/2015.
 */

function MysqlNotLike(string){
    this.string = string;
}

MysqlNotLike.prototype.mountWhere = function(variable){
    return variable + " not like '%" + this.string + "%'";
};

module.exports = MysqlNotLike;