(function(Conditions){

	"use strict";

	var nodebb = require('./nodebb');

	Conditions.get = function(conditions, callback) {
		conditions = conditions.concat([
			{
				"name": "Accepted Invitations",
				"condition": "invite/accepted-invitations"
			}
		]);

		callback(null, conditions);
	};

}(exports));
