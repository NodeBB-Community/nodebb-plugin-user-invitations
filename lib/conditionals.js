(function(Conditionals){

	"use strict";

	var nodebb = require('./nodebb');

	Conditionals.get = function (conditionals, callback) {
		nodebb.db.getSortedSetRange('plugins:active', 0, -1, function (err, activePlugins) {
			if (Array.isArray(activePlugins) && activePlugins.indexOf("nodebb-rewards-essentials") === -1) {
				conditionals = conditionals.concat([
					{
						"name": ">",
						"conditional": "greaterthan"
					},
					{
						"name": ">=",
						"conditional": "greaterorequalthan"
					},
					{
						"name": "<",
						"conditional": "lesserthan"
					},
					{
						"name": "<=",
						"conditional": "lesserorequalthan"
					},
					{
						"name": "string:",
						"conditional": "string"
					}
				]);
			}

			callback(null, conditionals);
		});
	};

	Conditionals.greaterthan        = function(data, callback) { callback(false, parseInt(data.left) >  parseInt(data.right)) }
	Conditionals.greaterorequalthan = function(data, callback) { callback(false, parseInt(data.left) >= parseInt(data.right)) }
	Conditionals.lesserthan         = function(data, callback) { callback(false, parseInt(data.left) <  parseInt(data.right)) }
	Conditionals.lesserorequalthan  = function(data, callback) { callback(false, parseInt(data.left) <= parseInt(data.right)) }
	Conditionals.string             = function(data, callback) { callback(false, data.left === data.right) }

}(exports));
