(function(UserInvitations){

const nodebb = require('./nodebb')

const fs = require('fs')
const path = require('path')

// TODO: Expose only hooks.
UserInvitations.init         = init
UserInvitations.conditionals = require('./conditionals')
UserInvitations.conditions   = require('./conditions')
UserInvitations.rewards      = require('./rewards')
UserInvitations.invitations  = require('./invitations')
UserInvitations.views        = require('./views')

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
	,	giveReward : UserInvitations.invitations.giveReward
	,	setInvites : UserInvitations.invitations.setInvites
	};

	UserInvitations.views.init(data, callback);
}

}(exports))
