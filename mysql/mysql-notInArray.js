/**
 * Created by joao.bruno on 03/03/2015.
 */

function MysqlNotInArray(array){
    if(array instanceof Array) {
        this.array = array;
    } else {
        this.array = [];
    }
}

MysqlNotInArray.prototype.mountWhere = function(variable){
    var values = "";

    for (var i = 0; i < this.array.length; i++) {
        if(values === "") {
            values = "(";
        } else {
            values += ",";
        }

        values = values + "'" + this.array[i] + "'";

    }

    if(values === ""){
        return "";
    }

    values += ")";

    return variable + " NOT IN " + values;
};

module.exports = MysqlNotInArray;