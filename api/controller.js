var _ = require('lodash');
var uniqid = require('uniqid');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var logger = require('../util/logger');
var Todo = require('./todoModel.js');
require('dotenv').config();

// helper functions
var signToken = function(id) {
	return new Promise(function(resolve, reject) {
        resolve(jwt.sign(
            {_id:id},
            config.secrets.jwt,
            {expiresIn: config.expireTime}
        ));
    }); 
}

var findTask = function(uniqueid) {
    return new Promise(function(resolve, reject) {

        Todo.find({uniqueid: uniqueid})
        .exec()
        .then(function(item) {
            if(!item) {
                reject(new Error('No todo item with that id'));
            } else {
                resolve(item);
            }
        }, function(err) {
            next(err);
        });
    });
};

var cleanBeforeSending = function(todo) {
    var oTodo = todo.toJson();
    delete oTodo._id;
    delete oTodo.__v;
    delete oTodo.uniqueid;
    for(var h = 0; h < oTodo.tasks.length; h++) {
        delete oTodo.tasks[h]._id;
    }
    return oTodo;
}
// methods

exports.params = function(req, res, next, token) {
    jwt.verify(token, config.secrets.jwt, function(err, decoded) {
        if (err) {
            switch(err.name) {
                case 'TokenExpiredError':
                    next(new Error('Token expired'));
                    break;
                case' JsonWebTokenError':
                    next(new Error('Something went wrong with the token'));
                    break;
                default:
                    next(new Error('Something went wrong'));
            }
        } else {
            req.decoded = decoded;
            req.token = token;
            next();
        }
      });
};

exports.newPage = function(req, res, next) {
    var id = uniqid();
    signToken(id).
    then(function(arg){
        var oRes = {
            success: true,
            status: 0,
            token: arg
        };
        var sResponse = JSON.stringify(oRes);
        res.type('json');
        res.status(200).send(sResponse);
    }).
    catch(function(err) {
        logger.error('new Page');
        console.log(err);
    })
};

// GET TASKS

exports.loadPage = function(req, res, next) {
    // get the task for the given uniqueid
    findTask(req.decoded._id).
    then(function(item){
        var status = item.length == 0 ? 0 : 1;
        var oRes = {
            success: true,
            status: item.length == 0 ? 0 : 1,
            token: req.token,
            expiresAt: new Date(req.decoded.exp*1000),
            payload: item.length == 0 ? [] : cleanBeforeSending(item[0])
        };
        var sResponse = JSON.stringify(oRes);
        res.type('json');
        res.status(200).send(sResponse);
    }).
    catch(function(err) {
        next(err);
    });
};

// POST TASKS
exports.createTasks = function(req, res, next) {
    var title = req.body.title;
    var tasks = req.body.tasks;

    req.checkBody('title', 'Invalid Title.').notEmpty().title();
    req.checkBody('tasks', 'Invalid Tasks. Must be less than 120 characters.').notEmpty().tasks();
    req.checkBody('tasks', '30 tasks is the max').tasksLen();

    var errors = req.validationErrors();

	if(errors){
		var errorMsg = '';
		for(var j = 0; j< errors.length;j++){
			if(j !== (errors.length-1)) {
				errorMsg += errors[j].msg + ' ';
			} else {
				errorMsg += errors[j].msg;
			}
		}
		var oRes = {
			success: false,
			payload: {error: errorMsg}
		};
		var sResponse = JSON.stringify(oRes);
		res.type('json');
		res.status(400).send(sResponse); // validation error
	} else {

		var newTodo = new Todo({
            title: title,
            tasks: tasks,
            uniqueid: req.decoded._id,
            expiresAt: new Date(req.decoded.exp*1000)
        });
        console.log(req.decoded);
        newTodo.save(function(err, savedTodo) {
            if (err) {
                logger.error(err);
                res.status(400).send('Something went wrong with your request.');
            } else {
                var oRes = {
                    success: true,
                    status: savedTodo.tasks.length == 0 ? 0 : 1,
                    token: req.token,
                    expiresAt: new Date(req.decoded.exp*1000),
                    payload: cleanBeforeSending(savedTodo)
                };
                var sResponse = JSON.stringify(oRes);
                res.type('json');
                res.status(200).send(sResponse);
            }
        });
    }
};

// PUT Tasks

exports.updateTasks = function(req, res, next) {
    var title = req.body.title;
    var tasks = req.body.tasks;

    req.checkBody('title', 'Invalid Title.').notEmpty().title();
    req.checkBody('tasks', 'Invalid Tasks. Must be less than 120 characters.').notEmpty().tasks();
    req.checkBody('tasks', '10 tasks is the max').tasksLen();

    var errors = req.validationErrors();

	if(errors){
		var errorMsg = '';
		for(var j = 0; j< errors.length;j++){
			if(j !== (errors.length-1)) {
				errorMsg += errors[j].msg + ' ';
			} else {
				errorMsg += errors[j].msg;
			}
		}
		var oRes = {
			success: false,
			payload: {error: errorMsg}
		};
		var sResponse = JSON.stringify(oRes);
		res.type('json');
		res.status(400).send(sResponse); // validation error
	} else {
        findTask(req.decoded._id).
        then(function(item){
            if (item.length == 0) {
                next (new Error('could not find the todo to update.'));
            } else {
                var todo = item[0]
                if (title.length !== 0) {
                    todo.title = title;
                }
                if (tasks.length !== 0) {
                    todo.tasks = tasks;
                }
                todo.save(function(err, savedTodo) {
                    if (err) {
                        console.log(err);
                        res.status(400).send('Something went wrong updating the todo');
                    } else {
                        var oRes = {
                            success: true,
                            status: savedTodo.tasks.length == 0 ? 0 : 1,
                            token: req.token,
                            expiresAt: new Date(req.decoded.exp*1000),
                            payload: cleanBeforeSending(savedTodo)
                        };
                        var sResponse = JSON.stringify(oRes);
                        res.type('json');
                        res.status(200).send(sResponse);
                    }
                });
            }
        }).
        catch(function(err) {
            next(err);
        });
    }
};

// DELETE Tasks

exports.deleteTasks = function(req, res, next) {
    findTask(req.decoded._id).
    then(function(item){
        if (item.length == 0) {
            next (new Error('could not find the todo to delete.'));
        } else {
            var todo = item[0]
            todo.remove(function (err, deletedTodo) {
                if (err) {
                    logger.error(err);
                } else {
                    res.status(200).send({});
                }
              });
        }
    }).
    catch(function(err) {
        next(err);
    });
;}

exports.badPath = function(req, res, next) {
	var oRes = {
		success: false,
		payload: {
			error: "Invalid path."
		}
	};
    var sResponse = JSON.stringify(oRes);
	res.type('json');
	res.status(401).send(sResponse);
};