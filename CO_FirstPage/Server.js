//++++++++++++++++++++
//
// Server
//
// A node.js server that is part of ChipOut
// The server provides users with the "default web-page" for exclusion 
//
//  
//

var express = require('express');
var routes = require ('./Routes');

var app = express();





// GET routes
//====================

// returns the index page of the web
app.get ('/', routes.GetIndexPage); 



// start server
app.listen(3000);