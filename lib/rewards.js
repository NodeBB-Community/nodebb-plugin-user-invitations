(function(Rewards){

	"use strict";

	var backend = require('./backend');
	var logger = require('./logger');
	var nodebb = require('./nodebb');
	var invitations = require('./invitations');

	Rewards.get = function(rewards, callback) {
		rewards = rewards.concat([
			{
				"rid": "invite/give-invitations",
				"name": "Give Invitations",
				"inputs": [
					{
						"type": "text",
						"name": "numInvitations",
						"label": "Invitations:"
					}
				]
			}
		]);

		callback(null, rewards);
	};

	Rewards.giveInvitations = function (data) {
		if (!data || !data.uid || !data.reward.numInvitations || !(parseInt(data.reward.numInvitations, 10) > 0) ) return console.log("Error giving reward giveInvitations");
		backend.incInvitesMax(data.uid, parseInt(data.reward.numInvitations, 10));
	};

}(exports));
