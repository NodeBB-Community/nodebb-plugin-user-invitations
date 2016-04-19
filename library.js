(function(UserInvitations){

"use strict";

var nodebb = require('./lib/nodebb');

var fs   = require('fs');
var path = require('path');

UserInvitations.init         = init;
UserInvitations.conditionals = require('./lib/conditionals');
UserInvitations.conditions   = require('./lib/conditions');
UserInvitations.rewards      = require('./lib/rewards');
UserInvitations.invitations  = require('./lib/invitations');
UserInvitations.views        = require('./lib/views');

function init(data, callback) {
	// Socket events for user pages.
	console.log(UserInvitations.invitations);
	nodebb.socketPlugins.invitation = {
		send     : UserInvitations.invitations.socketio.userSend
	,	uninvite : UserInvitations.invitations.socketio.userUninvite
	,	reinvite : UserInvitations.invitations.socketio.userReinvite
	};

	nodebb.socketAdmin.invitation = {
		send     : UserInvitations.invitations.socketio.adminSend
	,	reinvite : UserInvitations.invitations.socketio.adminReinvite
	};

	UserInvitations.views.init(data, callback);
}

}(exports));
