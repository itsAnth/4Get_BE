var router = require('express').Router();
var path    = require("path");
var controller = require('./controller');
var logger = require('../util/logger');


router.param('token', controller.params);

router.route('/:token').get(controller.loadPage).post(controller.createTasks).put(controller.updateTasks).delete(controller.deleteTasks);

router.route('/').get(controller.newPage);

router.route('*').all(function(req, res) {
    console.log("does this go");
	var oRes = {
		success: false,
		payload: {
			error: "Invalid path."
		}
	};
	var sResponse = JSON.stringify(oRes);
	res.type('json');
	res.status(401).send(sResponse);
});

module.exports = router;