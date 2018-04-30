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


if (process.argv.length > 2) {
  if (process.argv[2] == "-d") {
  	dbgflag  = true;
  	if (dbgflag) {console.log ("\nDebug set!");}
  }
} else {
	// in debug mode we do not use the back-end datastore
	var redis = require ('redis');
	var client = redis.createClient(6379,'redis');
}


/*******************************************************************************************
** Support functions to handle required actions
*******************************************************************************************/

//
// Generate new key 
//
function GenerateKey (){
  var estring = 'var newKey=String.fromCharCode(';

  for (var i=1; i<=10; i++) {
     var ran = Math.floor(Math.random()*88);
     ran += 33; // make it ASCII
     if (i<10)
       estring += ran + ',';
     else
       estring += ran + ');';
  }

  eval(estring);
  // kolla om nyckeln redan finns isf kör vi igen annars returneras den
//if ()
//  console.log ("New Key: " + newKey + "\n");
  return (newKey);
  
} // GenerateKey


// Object constructors
function Exclusion (type, game, fromTime, toTime) {
	if (dbgflag) {console.log ("\nIn Exclusion...creating object... type: ",  type, "game: ", game, "from: ", fromTime, "to:", toTime);}
	
	this.Created = dateAndTime();
	this.Type = type;
	this.Game = game;
	this.ValidFrom = fromTime;
	this.ValidTo = toTime;
	return (this);
}

function Logrecord (key, operation, uid, type, game, fromTime, toTime, year, gender, status) {
	
	var clientInfo = client.get(key);

	this.Timestamp = dateAndTime();
	this.Operation = operation;
	this.ExcludedAt = clientInfo.CompanyName;
	this.UID = uid;
	this.Type = type;
	this.Game = game;
	this.ValidFrom = fromTime;
	this.ValidTo = toTime;
	this.Year = year;
	this.StatusReturned = status;
	return (this);
}


function WriteLogRecToQueue (logrec) {
	var logmsg = JSON.stringify(logrec);
	if (dbgflag) {console.log ("In WriteLogRecToQueue: ", logmsg);}

	var num = client.publish ("chipoutmsg", logmsg);
	if (dbgflag) {console.log ("In WriteLogRecToQueue, msg published, num listeners: ", num);}

}

//
// Calculates the end date of the exclusion
//
function CalculateEndDate(duration) {

	var numToAdd = [];
	var newDate = dateAndTime();

	if ((numToAdd = duration.match(/(\d+)(d)/)) !== null) {
		newDate.addDays (parseInt(numToAdd[1]));
	} 
	else {
		if ((numToAdd = duration.match(/(\d+)(w)/)) !== null) {
			newDate.addWeeks (parseInt(numToAdd[1]));
		}
		else {
			if ((numToAdd = duration.match(/(\d+)(m)/)) !== null) {
				newDate.addMonths (parseInt(numToAdd[1]));
			}
		}
	}
	if (dbgflag) {console.log ("Calculated new date: ", newDate);}
	return (newDate);
}

function fixDateFormat (y,m,d) {
	var retval = y +'-';
	
	m = m + 1;
	if (parseInt(m)<9) {m = '0' + m;}
	if (parseInt(d)<9) {d = '0' + d;}
	retval = retval + m + '-' + d;
	
    return (retval);
}

//*********************************************************************************************
//
//  Helpers to handle date calculations 
//
//*********************************************************************************************

        
Date.prototype.addSeconds = function(seconds) {
    this.setSeconds(this.getSeconds() + seconds);
    return this;
};

Date.prototype.addMinutes = function(minutes) {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
};

Date.prototype.addHours = function(hours) {
    this.setHours(this.getHours() + hours);
    return this;
};

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + days);
    console.log (days, this);
    return this;
};

Date.prototype.addWeeks = function(weeks) {
    this.addDays(weeks*7);
    return this;
};

Date.prototype.addMonths = function (months) {
    var dt = this.getDate();

    this.setMonth(this.getMonth() + months);
    var currDt = this.getDate();

    if (dt !== currDt) {  
        this.addDays(-currDt);
    }

    return this;
};

Date.prototype.addYears = function(years) {
    var dt = this.getDate();

    this.setFullYear(this.getFullYear() + years);

    var currDt = this.getDate();

    if (dt !== currDt) {  
        this.addDays(-currDt);
    }

    return this;
};

function dateAndTime () {
	var now = new Date();
	var offset= -now.getTimezoneOffset();

	now.addMinutes(offset);	 
	return (now);
}


//*********************************************************************************************
//
//  Functions to validate Posted parameters 
//
//*********************************************************************************************

// CheckAPIKey
// Called to verify that the provided key is valid
//
function CheckAPIKey(apiKey) {
	if (dbgflag) {console.log ("\nIn CheckAPIKey key= ", apiKey);}
	var retval = true;

	if (dbgflag == false) {
	if (client.get(apiKey)) {
		retval = true;
		if (dbgflag) {console.log ("....OK -- Key found ", apiKey);}
	} else {
		retval = false;
		if (dbgflag) {console.log ("ERROR -- Key not found");}
		globalErrMsg = "ERROR -- Invalid API-key " + apiKey; 
  	}
  }
  	return (retval);
} // CheckAPIKey



// CheckUid
// Called to verify the length of the UID
//
function CheckUid(uid) {
	if (dbgflag) {console.log ("\nIn CheckUid uid= ", uid);}
	var retval = true;

	if (dbgflag == false) {
	if (uid.length === 64) {
		retval = true;
		if (dbgflag) {console.log ("....OK -- Length of uid correct ", uid);}
	} else {
		retval = false;
		if (dbgflag) {console.log ("ERROR -- Length of uid not correct ", uid);}
		globalErrMsg = "ERROR -- Length of uid not correct " + uid;

  	}
  }
  	return (retval);
} // CheckUid


// CheckType
// Called to validate that the type is one or more of GAMES, ADS or DM and nothing else
//
function CheckType(excludeType) {
  	// GAME / DM / AD
	var retval = true;

	if (dbgflag) {console.log ("\nIn CheckType type = ", excludeType, " ", excludeType.length);}

	// loop over all elements in the list and verify that we have valied elements
	for (var i=0; i<excludeType.length; i++) {
		if ((excludeType[i] === "GAMES") ||
			(excludeType[i] === "ADS") ||
			(excludeType[i] === "DM")) {
			if (dbgflag) {console.log ("....OK -- type verified ", excludeType[i]);}	
		} else {
			retval = false;
			if (dbgflag) {console.log ("....ERROR -- Invalid type");}
			globalErrMsg = "ERROR -- Invalid type " + excludeType; 
			break;
		}
	} // for

  	return (retval);
} // CheckType


// CheckGame
// Called to validate that the game is one or more of ... and nothing else
// The check is only done if GAME exist as part of the type parameter
// 
function CheckGame(excludeType,game) {
	// [ALL, SLOTS, CASINO, POKER, BETTING]
	if (dbgflag) {console.log ("\nIn CheckGame game = ", game);}
	var retval = true;  // We know that we have a correct type, check game only for GAME type

	if (excludeType.includes("GAMES")) {
		for (var i=0; i<excludeType.length; i++) {
			if ((game[i] === "ALL") ||
				(game[i] === "POKER") ||
				(game[i] === "ROULETT") ||
				(game[i] === "BACCARAT") ||
				(game[i] === "PUNTOBANCO") ||
				(game[i] === "BLACKJACK") ||
				(game[i] === "CASINO") ||
				(game[i] === "SLOTS") ||
				(game[i] === "BETTING")) {
				if (dbgflag) {console.log ("....OK -- game verified ", game[i]);}	
			} else {
				retval = false;
				if (dbgflag) {console.log ("....ERROR -- Invalid game " + game[i]);}
				globalErrMsg = "ERROR -- Invalid game type " + game; 
				break;
			}
		} // for
  	} // if GAMES

  	return (retval);
} // CheckGame


function CheckDuration (duration) {
	// (\d+d) or (\d+w) or (\d+m)  any number of days, weeks or months 
	if (dbgflag) {console.log ("\nIn CheckDuration duration = ", duration);}
	var retval = false;

	if (duration.match(/(\d+)(w|m|d)/)) {
		retval = true;
	} else {
		retval = false;
		if (dbgflag) {console.log ("ERROR -- Invalid duration");}
		globalErrMsg = "ERROR -- Invalid duration " + duration; 
	}
  	
  	return (retval);
} // CheckDuration


function CheckYear (year) {
	// 1967 
	if (dbgflag) {console.log ("\nIn CheckYear year = ", year);}
	var retval = false;

	if (year.match(/(\d\d\d\d)/)) {
			retval = true;
		} else {
			retval = false;
			if (dbgflag) {console.log ("ERROR -- Invalid Birthyear");}
			globalErrMsg = "ERROR -- Invalid format of parameter year " + year; 
  		}

  	return (retval);
} // CheckYear


function CheckGender (gender) {
	// M | F | N 
	if (dbgflag) {console.log ("\nIn CheckGender gender = ", gender);}
	var retval = false;
	if (gender.search("(M|F|N)") > -1) {
		retval = true;
		if (dbgflag) {console.log (".... OK -- Valid Gender value " + gender);}
	}	
	else {
		retval = false;
		if (dbgflag) {console.log ("ERROR -- Invalid Gender value");}
		globalErrMsg = "ERROR -- Invalid gender value " + gender; 
	}

  	return (retval);
} // CheckGender


function CheckForKeys (obj) {
	
	var retval = true;

	// verify that all keys are availiable in object
	if (obj.hasOwnProperty ("key") &&
		obj.hasOwnProperty ("uid") &&
		obj.hasOwnProperty ("type") &&
		obj.hasOwnProperty ("games") &&
		obj.hasOwnProperty ("duration") &&
		obj.hasOwnProperty ("year") &&
		obj.hasOwnProperty ("gender")) {
		
		if (dbgflag) {console.log("All keys present");}
		
	}
	else {
		if (dbgflag) {console.log("All keys NOT present");}
		globalErrMsg = "Missing required keys in JSON structure!" + JSON.stringify(obj);
		retval = false;
	}	
	return (retval);
} // function


/*******************************************************************************************
** setup
*******************************************************************************************/

exports.setup = function () {

  console.log ("-->In setup\n");
  
  var svs = {"Operator" 		: "SvS",
		   	 "FullName"	  		: "AB Svenska Spel",
		   	 "GamesProvided" 	: ["Poker", "Bingo", "Casino", "Slots"],
		   	 "DateCreated"		: "2018-01-02",
		   	 "DateChanged"		: "",
		   	 "ChangeKeyNow"		: true,
		   	 "LogID"			: 1031};
  var jsonsvs = JSON.stringify(svs);

  var atg = {"Operator" 		: "ATG",
		   	 "FullName"	  		: "AB Trav och Galopp",
		   	 "GamesProvided" 	: ["Hästar"],
		   	 "ChangeKeyNow"		: true,
		   	 "LogID"			: 1034};
  var jsonatg = JSON.stringify(atg);

  var mrg = {"Operator" 		: "ATG",
		   	 "FullName"	  		: "AB Trav och Galopp",
		   	 "GamesProvided" 	: ["Hästar"],
		   	 "ChangeKeyNow"		: true,
		   	 "LogID"			: 1035};
  var jsonmrg = JSON.stringify(mrg);

  client.set ("zz934Yi55r", jsonsvs, function(err, value) {
                 if (err) {
                   console.error("error");
                 }});
  
  client.set ("Pz008LK23U", jsonatg, function(err, value) {
			     if (err) {
			       console.error("error");
			     }});

  client.get("zz934Yi55r", function(err, value) {
                 if (err) {
                     console.error("error");
                 } else {
                     console.log("Worked: " + value);
                 }});
		
}


/*******************************************************************************************
** Routes used by ChipOut API server
*******************************************************************************************/

//
//  POST actions
//



//++
//
// excludeClient
// Creates a new Excluded Client record and stores it in Redis
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
exports.excludeCustomer1 = function (req, res) {
	var apiKey = req.body.key;			// API Key for requestor
	var UID = req.body.uid;				// Unique ID of client to exclude - a SHA256 hash value
	var excludeType = req.body.type;	// What to exclude from GAMES/DM/AD/ALL
	var excludeGame = req.body.game;	// If game, what or wich games
	var excludeFrom = req.body.from; 	// Date and time to start exclusion
	var excludeDuration = req.body.duration;		// Lenght of exclusion, defaults to 30 days
	var excludeYS = req.body.yeargender;	// Year of birth and Gender of client beeing excluded
	var status = 400;

	// make sure that all optional parameters have a value
	if (excludeGame == undefined) {excludeGame = "";}
	if (excludeFrom == undefined) {excludeFrom = "";}
	if (excludeDuration == undefined) {excludeDuration = "";}

	// verify all parameters provided
	if ((CheckAPIKey(apiKey) == 1) && 
		(CheckType(excludeType) == 1) && 
		(CheckGame(excludeType, excludeGame) == 1) && 
		(CheckDuration(excludeDuration) == 1) && 
		(CheckYearAndGender(excludeYS) == 1) ) {
	
		var date = new Date();
		excludeFrom = date.toUTCString();
		var endDate = CalculateEndDate(excludeFrom, excludeDuration);

		// create the object we need
		var exclusionObject = new Exclusion(excludeType, excludeGame, excludeFrom, endDate);
		var excStr = JSON.stringify(exclusionObject);
		if (dbgflag) {console.log("ExRecord: ", excStr);}

		// check to see if there is a previous log record for this id, if so, 
		// append a new json record to the current, otherwise just create a new
		client.get (UID, function (err, data) {
			if (err) {
				data = excStr;
			}
			else {
				if (data == null) {
					data = excStr;
				}
				else {
					data = data + "|" + excStr;
				}
			}
			// store the record in the Redis datastore
			client.set (UID, data, function (err, data2) {
				if (err) {
					status = 500; // internal server error
				}
				else {
					status = 201; // created	
					if (dbgflag) {console.log ("Created an entry for key= ", UID);}
					var tmp = "Clean" + exclusionObject.ValidTo;
					if (dbgflag) {console.log ("Valid To = <", tmp,">");}


				}
				// post a logrecord to the Queue for others to pick up
				var logrec = new Logrecord(apiKey, "POST", UID, excludeType, excludeGame, excludeFrom, endDate, excludeYS, status);
				WriteLogRecToQueue(logrec);

				// return with status to caller
				res.status(status).end();
			});

		});

	} // if
	else {
		res.status(400).end(); // bad request
	}

} // function


//++
//
// excludeClient
// Creates a new Excluded Client record and stores it in Redis
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
exports.excludeCustomer = function (req, res) {
	
	var status = 400;
	var params;

	// when we come here the req.body is an object, we need to verify that all parameters are present
	if (CheckForKeys (req.body)) {
		params = req.body;
		
		// verify all parameters provided
		if ((CheckAPIKey(params.key) === true) && 
			(CheckUid(params.uid) === true) && 
			(CheckType(params.type) === true) && 
			(CheckGame(params.type, params.games) === true) && 
			(CheckDuration(params.duration) === true) && 
			(CheckYear(params.year) === true) && 
			(CheckGender(params.gender) === true) ) {
		
			// enforce empty games array if GAMES isn't present
			if (!params.type.includes("GAMES")) {params.games=[];}

			
			var excludeFrom = dateAndTime();
			var endDate = CalculateEndDate(params.duration);

			// create the object we need
			var exclusionObject = new Exclusion(params.type, params.games, excludeFrom, endDate);
			var excStr = JSON.stringify(exclusionObject);
			if (dbgflag) {console.log("\nExRecord: ", excStr);}

			// check to see if there is a previous log record for this id, if so, 
			// append a new json record to the current, otherwise just create a new
			if (dbgflag === false) {
			client.get (UID, function (err, data) {
				if (err) {
					data = excStr;
				}
				else {
					if (data === null) {
						data = excStr;
					}
					else {
						data = data + "|" + excStr;
					}
				}
				// store the record in the Redis datastore
				client.set (UID, data, function (err, data2) {
					if (err) {
						status = 500; // internal server error
					}
					else {
						status = 201; // created	
						if (dbgflag) {console.log ("Created an entry for key= ", UID);}
						var tmp = "Clean" + exclusionObject.ValidTo;
						if (dbgflag) {console.log ("Valid To = <", tmp,">");}


					}
					// post a logrecord to the Queue for others to pick up
					var logrec = new Logrecord(apiKey, "POST", UID, excludeType, excludeGame, excludeFrom, endDate, excludeYS, status);
					WriteLogRecToQueue(logrec);

					// return with status to caller
					res.status(status).end();
				});

			}); 
		  	} // if not debug
		  	else {res.status(200).end();}
		} // if all parameters are ok
		else {
			res.status(400).end(globalErrMsg); // bad request, parameter error
		}
	} else {
		res.status(400).end(globalErrMsg); // bad request, not all keys present
	}

} // function



/*******************************************************************
**
**  GET actions
**
*******************************************************************/

//++
//
// requireKey
// Is called the first time an operator would 
// Params, required
//
//--
exports.requireKey = function (req, res) {
	var key = req.params.tmpkey;
	var id = req.params.id;
	
	var newkey = GenerateKey();
	
	console.log ("Key: " + key + "  ID: " + id);

    var retval = '{"NewKey" : "' + newkey + '"}';

    client.set (newkey, id); 
	res.send(retval);

};


exports.GetIndexPage = function (req, res) {
	console.log ("In getIndexPage");
	res.sendFile(path.join(__dirname + '/index.html'));
//	res.sendFile("./index.html");
}


exports.customerStatus = function (req, res) {
	var key = req.params.key;
	var uid = req.params.uid;
	var status = 200;
	
	console.log ("customerStatus key=<",key,"> uid=<",uid,">\n");

	client.get (uid, function (err, data) {
		if (err) {
			// no data found for given id
			console.log ("No data found key=<",key,"> uid=<",uid,">\n");
		} else {

		}
	});

	res.status(status).send({"Game" : [{"Type" : "Poker", "From" : "2013-10-01", "To" : "2013-12-31"}],
	          "DM": {},
			  "AD": {"From" : "2013-10-01", "To" : "2019-12-31"}
	         });
//	res.send({id:req.params.id});
}

