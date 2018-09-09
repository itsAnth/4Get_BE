// modules
var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

// required files
var api = require('./api/api');
var config = require('./config/config');
var logger = require('./util/logger');	

// other variables
var app = express();

// set up
mongoose.connect(config.db.url);
app.use(morgan('dev'));

// express config
// custom validator
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator({
	customValidators: {
		tasks: function(tasks) {
			for (var i = 0; i < tasks.length; i++) {
				if (tasks[i].length > 120) {
					return false;
				}
			}
			return true;
		},
		tasksLen: function(tasks) {
			return tasks.length <31 ? true : false;
		},
		title: function(title) {
			return title.length <21 ? true : false;
		}
	}
}));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });

app.all('*',function(req,res,next)
  {
	  if (!req.get('Origin')) return next();
  
	  res.set('Access-Control-Allow-Origin','*');
	  res.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE');
	  res.set('Access-Control-Allow-Headers','X-Requested-With,Content-Type');
  
	  if ('OPTIONS' == req.method) return res.send(200);
  
	  next();
  });

app.get('/favicon.ico', (req, res) => res.status(204));
app.use('/', api);
// setup global error handling
app.use(function(err, req, res, next) {
	var errMessage;
	if (err.message === '') {
		errMessage = 'Something went wrong with your request.';
	} else {
		errMessage = err.message;
	}
	var oRes = {
		success: false,
		payload: {error: errMessage}
	};
	var sResponse = JSON.stringify(oRes);
	res.type('json');
	switch(err.message) {
		case "406":
		    res.status(406).send(sResponse);
		    break;
		default:
		    res.status(400).send(sResponse);
	}
});

app.listen(config.port, function() {
	console.log('Node app is running on port', config.port);
});