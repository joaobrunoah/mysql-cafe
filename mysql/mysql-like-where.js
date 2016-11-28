/**
 * Created by joao.bruno on 05/02/2015.
 */

function MysqlLike(string, not){
    this.string = string;
    this.not = not;
}

MysqlLike.prototype.mountWhere = function(variable){
    return variable + (this.not ? ' not ' : '') + " like '%" + this.string + "%'";
};

module.exports = MysqlLike;