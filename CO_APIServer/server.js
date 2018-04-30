//++++++++++++++++++++
//
// Server
//
// A node.js server to handle self exclusion of gamblers
//
//
// Public API, acessible over HTTPS and/or VPN
// 	POST /excludeCustomer
//

var express = require('express');
var bodyParser = require('body-parser')
var routes = require ('./routes');

var app = express();


app.use(bodyParser.json() );       
app.use((err, req, res, next) => {
  if (err) {
    console.log('Invalid Request data', err);
    res.status(400).send('Posted data has to be JSON formatted');
  } else {
    next();
  }
})
//app.use(bodyParser.urlencoded({ extended: false }));


// POST routes
//====================

// v1.3 of the api will handle all functionality
// creates a new excluded client record
// Either GAME, DM or AD exclusion 
app.post ('/api/v13/exclude-customers', routes.excludeCustomer); 




// GET routes
//====================

// returns the index page of the web
app.get ('/', routes.GetIndexPage); 


// returns a JSON structure
app.get ('/api/v1.3/customer-status', routes.customerStatus); 


// start server
app.listen(3000);