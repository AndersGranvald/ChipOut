//+++++++++++++++
//
// Routes
//
// Express routes for ChipOut First Page Server
//
//
//
//+++++++++++++++


var path = require('path');


exports.GetIndexPage = function (req, res) {
	console.log ("In getIndexPage");
	res.sendFile(path.join(__dirname + '/index.html'));
}



