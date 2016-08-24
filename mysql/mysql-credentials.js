/**
 * Created by joao.liz on 24/08/2016.
 */

var Credentials = function() {
};

Credentials.savedCredentials = {};

Credentials.addCredential = function(poolName, credentials) {

    var new_credentials = {};

    new_credentials.host = credentials.host;
    new_credentials.port = credentials.port ? credentials.port : '3306';
    new_credentials.user = credentials.user ? credentials.user : 'admin';
    new_credentials.password = credentials.password ? credentials.password : '';
    new_credentials.database = credentials.database ? credentials.database : 'default';
    new_credentials.connectionLimit = credentials.connectionLimit ? credentials.connectionLimit : 10;

    Credentials.savedCredentials[poolName] = new_credentials;

};

module.exports = Credentials;