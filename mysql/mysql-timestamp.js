/**
 * Created by joao.bruno on 28/01/2015.
 */

var moment = require('moment-timezone');

var MysqlTimestamp = function (year, month, day, hour, minute, second) {

    if (year && month && day && hour && minute && second) {
        this.date = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    } else {
        this.date = moment().format("YYYY-MM-DD HH:mm:ss");
    }
};

module.exports = MysqlTimestamp;

