(function(logger){

	"use strict";

	var winston = require.main.require('winston');

	logger.log = function (msg) {
		winston.info('[User Invitations] ' + msg);
	};

}(exports));
