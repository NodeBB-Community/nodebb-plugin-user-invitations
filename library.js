var	fs = require('fs'),
    groups = module.parent.require('./groups'),
	winston = module.parent.require('winston'),
	Meta = module.parent.require('./meta'),
	Sockets = module.parent.require('./socket.io/plugins'),
	User = module.parent.require('./user'),
	Emailer = module.parent.require('./emailer'),
	Plugins = module.parent.require('./plugins'),
	nconf = module.parent.require('nconf'),

	Invitation = {},
	invitedUsers = [],
	invitedGroup = null,
	uninvitedGroup = null,
	nonapprovedUserGroup = null,
    approvedUserGroup = null;

function sendInvite(email, group) {
	var url = nconf.get('url') + (nconf.get('url').slice(-1) === '/' ? '' : '/');

	if (!group) {
		Plugins.fireHook('action:email.send', {
			to: email,
			from: Meta.config['email:from'] || 'no-reply@localhost.lan',
			subject: "Invitation to join " + url,
			html: 'Join us by visiting <a href="' + url + 'register">' + url + 'register</a>',
			plaintext: 'Join us by visiting ' + url + 'register'
		});
	}else{
		Plugins.fireHook('action:email.send', {
			to: email,
			from: Meta.config['email:from'] || 'no-reply@localhost.lan',
			subject: "Invitation to join the group " + invitedGroup + " at " + url,
			html: 'Join the group ' + invitedGroup + ' by visiting <a href="' + url + 'invitation/' + email + '">' + url + 'invitation/' + email + '</a>',
			plaintext: 'Join the group ' + invitedGroup + ' by visiting ' + url + 'invitation/' + email,
		});
	}
}

Invitation.init = function(params, callback) {
	Sockets.invitation = {
		check: function (socket, data, callback) {
			User.email.available(data.email, function (err, available) {
				if (available) {
					if (Plugins.hasListeners('action:email.send')) {
						sendInvite(data.email);
					} else {
						winston.warn('[emailer] No active email plugin found!');
					}
					callback();
				}else{
					if (!invitedGroup) {
						callback(new Error('[[fail_email_taken]]'));
					}else{
						User.getUidByEmail(data.email, function (err, uid) {
							if (!err && uid) {
								groups.getUserGroups([uid], function (err, payload) {
									var alreadyInvited = false;
									payload = payload[0];

									for (var i in payload) {
										if (payload[i].name.toLowerCase() === invitedGroup.toLowerCase()) alreadyInvited = true;
									}

									if (!alreadyInvited) {
										if (Plugins.hasListeners('action:email.send')) {
											sendInvite(data.email, true);
											callback();
										} else {
											winston.warn('[emailer] No active email plugin found!');
											callback();
										}
										callback();
									}else{
										callback(new Error('[[fail_already_invited]]'));
									}
								});
							}else{
								if (!err) {
									callback(new Error('[[fail_already_invited]]'));
								}else{
									callback(new Error('[[fail_database_error]]'));
								}
							}
						});
					}
				}
			});
		},
		setInvitedUsers: function (socket, data, callback) {
			winston.info(data);
			Meta.settings.setOne('newuser-invitation', 'invitedUsers', JSON.stringify(data.users), function (err, data) {
				Invitation.sync();
			});
			callback();
		},
		send: function (socket, data, callback) {
			sendInvite(data.email, invitedGroup || uninvitedGroup);
			callback();
		}
	};

	function render(req, res, next) {
		res.render('admin/plugins/newuser-invitation', {});
	}

	Invitation.sync();

	params.router.get('/admin/plugins/newuser-invitation', params.middleware.admin.buildHeader, render);
	params.router.get('/api/admin/plugins/newuser-invitation', render);
	params.router.get('/invitation/:email', function (req, res, next) {
		winston.info(invitedUsers);
		if (!!~invitedUsers.indexOf(req.params.email) && invitedGroup) {
			groups.exists(invitedGroup, function (err, exists) {
				if (!err && exists) {
					User.getUidByEmail(req.params.email, function (err, uid) {
						if (!err && uid) {
							groups.join(invitedGroup, uid);
							invitedUsers.splice(invitedUsers.indexOf(req.params.email), 1);
							Meta.settings.setOne('newuser-invitation', 'invitedUsers', JSON.stringify(invitedUsers));
							res.send("You have been added to the group " + invitedGroup + "!  " + nconf.get('url') + 'groups/' + invitedGroup + " ");
						}else{
							res.send("Invitation Expired.");
							winston.warn(req.params.email + " tried to join group " + invitedGroup + " but it was not possible!");
						}
					});
				}else{
					res.send("Invitation Expired.");
					winston.warn(req.params.email + " tried to join group " + invitedGroup + " but it doesn't exist!");
				}
			});
		}else{
			res.send("Invitation Expired.");
			if (invitedGroup) {
				winston.warn(req.params.email + " tried to join group " + invitedGroup + " but was not invited!");
			}else{
				winston.warn(req.params.email + " tried to join the invited group but it doesn't exist!");
			}
		}
	});

	callback();
};

Invitation.sync = function () {
	Meta.settings.get('newuser-invitation', function(err, settings) {
		winston.info(settings);

		try {
			invitedUsers = settings.invitedUsers ? JSON.parse(settings.invitedUsers) : [];
		}catch(e){
			invitedUsers = [];
			Meta.settings.setOne('newuser-invitation', invitedUsers, '[]');
		}
		invitedGroup = settings.invitedGroup ? settings.invitedGroup : null;
		uninvitedGroup = settings.uninvitedGroup ? settings.uninvitedGroup : null;
		// approvedUserGroup = settings.approvedUserGroup;
		// nonapprovedUserGroup = settings.nonapprovedUserGroup;

		if (uninvitedGroup == null && invitedGroup == null) {
			winston.warn('[plugins/newuser-invitation] Restricting new user registration to invited users only!!!');
		}
	});
};

Invitation.moveUserToGroup = function(userData) {
	var invited = invitedUsers ? invitedUsers.indexOf(userData.email) : -1;

	// If invited, add to invited group.
	if (!!~invited) {
		if (invitedGroup != null) {
			invitedUsers.splice(invited, 1);
			Meta.settings.setOne('newuser-invitation', 'invitedUsers', JSON.stringify(invitedUsers));
			groups.exists(invitedGroup, function (err, exists) {
				if (!err && exists) {
					groups.join(invitedGroup, userData.uid);
				}else{
					winston.warn('[plugins/newuser-invitation] Invited Group does not exist!');
				}
			});
		}

	// If not invited, add to uninvited group.
	}else{
		if (uninvitedGroup != null) {
			groups.exists(uninvitedGroup, function (err, exists) {
				if (!err && exists) {
					groups.join(uninvitedGroup, userData.uid);
				}else{
					winston.warn('[plugins/newuser-invitation] Uninvited Group does not exist!');
				}
			});
		}
	}
};

Invitation.checkInvitation = function(data, next) {
	Invitation.sync();

	// Don't restrict registration if invite groups are set.
	if (invitedGroup || uninvitedGroup) return next(null, data);

	var invited = invitedUsers ? invitedUsers.indexOf(data.userData.email) : -1;

    if (!!~invited) {
		invitedUsers.splice(invited, 1);
		Meta.settings.setOne('newuser-invitation', 'invitedUsers', JSON.stringify(invitedUsers));
		return next(null, data);
    }else{
		return next(new Error('[[error:not-invited]] ' + data.userData.email));
	}
};

Invitation.admin = {
	menu: function(custom_header, callback) {
		custom_header.plugins.push({
			"route": '/plugins/newuser-invitation',
			"icon": 'fa-check',
			"name": 'New User Invitation'
		});

		callback(null, custom_header);
	}
};

module.exports = Invitation;
