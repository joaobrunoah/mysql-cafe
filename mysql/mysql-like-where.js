/**
 * Created by joao.bruno on 05/02/2015.
 */

function MysqlLike(string){
    this.string = string;
}

MysqlLike.prototype.mountWhere = function(variable){
    return variable + " like '%" + this.string + "%'";
};

module.exports = MysqlLike;