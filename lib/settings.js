"use strict";

var	logger = require('./logger'),
	SocketAdmin = require.main.require('./src/socket.io/admin'),
	Meta = require.main.require('./src/meta'),
	Settings = require.main.require('./src/settings');;

var	defaultSettings = {
	defaultInvitations: 10,
	restrictRegistration: 0,
	inviteGroup: 'registered-users',
	invitedUsers: []
};

var	settings = module.exports = new Settings('userinvitations', '1.0.0', defaultSettings, function () {

	function logSettings()
	{
		logger.log("Synced settings:");
		console.dir(settings.get());
		warnRestriction();
	}

	function warnRestriction()
	{
		if (!!settings.get('restrictRegistration')) logger.log("Restricting new user registration to invited users only!!!");
	}

	SocketAdmin.settings.syncUserInvitations = function (socket, data, next) {

		var	diffDefaultInvitations = settings.get('defaultInvitations');

		settings.sync(function () {
			logSettings();
			diffDefaultInvitations = settings.get('defaultInvitations') - diffDefaultInvitations;
			if (diffDefaultInvitations) {
				// TODO: Adjust available invitations for each user by diffDefaultInvitations.
			}

			next();
		});
	}

	logSettings();

	// TODO: Remove for v1
	// Import v0.1.0 Settings
	Meta.settings.get('newuser-invitation', function(err, oldsettings) {
		if (err || !oldsettings || !oldsettings.invitedUsers) return;

		logger.log("Found old invite data, importing...");

		try {
			var invitedUsers = oldsettings.invitedUsers ? JSON.parse(oldsettings.invitedUsers) : [];
			invitedUsers = settings.get('invitedUsers').concat(invitedUsers);
			settings.set('invitedUsers', invitedUsers);
			settings.persist(function () {
				logger.log("Successfully imported old invite data! Logging it on the screen...");
				console.dir(settings.get('invitedUsers'));
				Database.delete('settings:newuser-invitation');
			});
		}catch(e){
			logger.log("Error importing old invite data, puking it onto the screen...");
			console.dir(oldsettings);
			winston.warn("", e);
		}
	});

});


function isInvitedByAdmin(email, next) {
	logger.log("Getting isInvitedByAdmin of " + email);

	email = email.toLowerCase();
	// TODO
	var invitedUsers = settings.get('invitedUsers');
	if (!!~(invitedUsers ? invitedUsers.indexOf(email) : -1)) return next(null, true);
	next(null, false);
}

settings.isInvitedByAdmin = isInvitedByAdmin;
