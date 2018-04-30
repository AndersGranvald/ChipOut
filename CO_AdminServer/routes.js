//+++++++++++++++
//
// Routes
//
// Express routes for ChipOut API Server
//
// Relies on Redis for persistant store and Key-Value lookup
// The Redis datastore hold two kind of data
// 1. Information on excluded clients
// 2. Information on companies signed-up to the service
//
//
//+++++++++++++++



var path = require('path');
var dbgflag = false;
var globalErrMsg = "";

//var redis = require ('redis');
//var client = redis.createClient(6379,'redis');


if (process.argv.length > 2) {
  if (process.argv[2] == "-d") {
  	dbgflag  = true;
  	if (dbgflag) {console.log ("\nDebug set!");}
  }
} else {
	
}


/*******************************************************************************************
** Support functions to handle required actions
*******************************************************************************************/


/*******************************************************************************************
** Routes used by ChipOut API server
*******************************************************************************************/

//
//  POST actions
//





//++
//
// createOperator
// Creates a new Operator record and stores it in Redis
// Params, required
//			key 	- operator api key 
//			UID  	- unique id of client, SHA256 hash
//			type	- one of [GAMES, DM, ADS, ALL]
// Params, optional
//			game  	- only valid if type is GAME otherwise omitted; one of [ALL, POKER, BINGO, CASINO, SLOTS]
//			from  	- date and time from when exclusion start, default is direct, otherwise time is specified as 20180231T2100 - OPTION FOR LATER
//			duration - number of days +30d = 30 days = next month, +3m = exclude for 3 months, +0 = indefinite  
//
//--
exports.createOperator = function (req, res) {
	
	var status = 400;
	var params;


} // function



/*******************************************************************
**
**  GET actions
**
*******************************************************************/

exports.GetIndexPage = function (req, res) {
	console.log ("In getIndexPage");
	res.sendFile(path.join(__dirname + '/index.html'));
//	res.sendFile("./index.html");
}


//++
//
//
//--
exports.listOperators = function (req, res) {
	res.status(200).send("Foo");

};



