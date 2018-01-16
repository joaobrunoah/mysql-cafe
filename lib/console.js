/**
 * Created by joao.bruno on 23/01/2015.
 */

var Console = function(tag_name) {

    // if(Console.DEBUGMODE) {
    //     console["debug"] = function(value){
    //         console.log("[" + tag_name + "] [DEBUG] " + value);
    //     };
    // } else {
    console["debug"] = function(){};
    // }

    return console;
};

Console.DEBUGMODE = false;

module.exports = Console;