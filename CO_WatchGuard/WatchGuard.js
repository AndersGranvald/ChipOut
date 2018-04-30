//++++++++++++++++++++
//
// WatchGuard
//
// A node.js server that cleans old records from redis datastore
//
//
//


var redis = require ('redis');
var client = redis.createClient();


function cleaner () {
	console.log ("In cleaner function");
}

setInterval (cleaner, 5000);  // 1500 ms = 1,5 sek


