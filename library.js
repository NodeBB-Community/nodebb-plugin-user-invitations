"use strict";

var	NodeBB   = module.parent,
	Groups   = NodeBB.require('./groups'),
	Meta     = NodeBB.require('./meta'),
	User     = NodeBB.require('./user'),
	Emailer  = NodeBB.require('./emailer'),
	Plugins  = NodeBB.require('./plugins'),
	Database = NodeBB.require('./database'),

	nconf = NodeBB.require('nconf'),

	translator = NodeBB.require('../public/src/modules/translator'),

	Settings      = NodeBB.require('./settings'),
	SocketAdmin   = NodeBB.require('./socket.io/admin'),
	SocketPlugins = NodeBB.require('./socket.io/plugins'),

	fs      = require('fs'),
	async   = require('async'),
	winston = require('winston'),

	UserInvitations = module.exports;

function prepend(msg) { return "[User-Invitations] " + msg; }

function isInvitedByAdmin(email, next) {
	email = email.toLowerCase();
	var invitedUsers = UserInvitations.settings.get('invitedUsers');
	if (!!~(invitedUsers ? invitedUsers.indexOf(email) : -1)) return next(null, true);
	next(null, false);
}

function isInvitedByUser(email, next) {
	email = email.toLowerCase();
	Database.isSortedSetMember('invitation:uid', email, next);
}

function isInvited(email, next) {
	email = email.toLowerCase();
	async.parallel({
		isInvitedByAdmin : async.apply(isInvitedByAdmin, email),
		isInvitedByUser  : async.apply(isInvitedByUser, email)
	}, function (err, results) {
		next(err, results.isInvitedByAdmin || results.isInvitedByUser);
	});
}

// Hook: static:app.load
UserInvitations.init = function(data, callback) {

	winston.info(prepend("Initializing User-Invitations..."));

	var	app        = data.app,
		router     = data.router,
		middleware = data.middleware;

	// Send email and update database.
	function sendInvite(params, group) {

		var	email        = params.email.toLowerCase(),
			fromUser     = params.from,
			registerLink = nconf.get('url') + '/register',
			site_title   = Meta.config.title || Meta.config.browserTitle || 'NodeBB',
			subject      = '[[email:invite, ' + site_title + ']]';

		async.waterfall([
			function(next) {
				if (fromUser) {
					Database.sortedSetAdd('invitation:uid', fromUser, email);
					User.getUserField(fromUser, 'username', next);
				}else{
					translator.translate("[[invite:an-admin]]", function(username) {
						next(null, username);
					});
				}
			},
			function(username, next) {

				var emailData = {
					site_title: site_title,
					registerLink: registerLink,
					subject: subject,
					username: username
				};

				Emailer.sendToEmail('invitation', email, Meta.config.defaultLang, emailData, next);

			}
		], function (err) {
			if (err) winston.warn(err);
		});

	}

	function filterEmails(emails, next) {
		var payload = {sent:[],unavailable:[],error:[]};

		// Remove duplicates.
		emails = emails.sort().filter(function(item, pos, ary) {
			return !pos || item != ary[pos - 1];
		});

		// Check availability and if they were already invited.
		async.each(emails, function (email, next) {
			email = email.toLowerCase();

			async.parallel({
				isInvited: async.apply(isInvited, email),
				available: async.apply(User.email.available, email)
			}, function (err, results) {
				if (err) {
					payload.error.push(email);
					return next();
				}

				if (!results.available || results.isInvited) {
					payload.unavailable.push(email);
					return next();
				}

				payload.sent.push(email);
				return next();
			});
		}, function(){
			next(null, payload);
		});
	}

	function getUserInvites(uid, next) {
		async.parallel({
			invitesPending  : async.apply(Database.getSortedSetRangeByScore, 'invitation:uid', 0, 10000, uid, uid),
			invitesAccepted : function (next) {
				Database.getSortedSetRangeByScore('user:invitedby', 0, 10000, uid, uid, function (err, uids) {
					User.getUsersData(uids, next);
				});
			}
		}, next);
	}

	// Socket events for user pages.
	SocketPlugins.invitation = {

		// Check availability of emails and send them.
		send: function (socket, data, next) {

			if (!socket.uid) return;
			if (!data || !data.emails || !Array.isArray(data.emails) || !data.emails.length) return next(new Error('[[fail_no_emails]]'));

			filterEmails(data.emails, function (err, payload) {

				// Check that the user has enough available invites to send.
				getUserInvites(socket.uid, function (err, invites) {
					if (err) return next(new Error('[[fail_db]]'));

					if (UserInvitations.settings.get('defaultInvitations') - invites.invitesPending.length - invites.invitesAccepted.length < payload.sent.length) return next(new Error('[[not_enough_invites]]'));

					payload.sent.forEach(function(email){
						sendInvite({email: email.toLowerCase(), from: socket.uid});
					});

					next(null, payload);
				});
			});
		},

		// User uninvite.
		uninvite: function (socket, data, next) {

			if (!socket.uid) return;
			if (!(data && data.email)) return next(new Error("No email to uninvite."));

			var	email = data.email.toLowerCase();

			Database.sortedSetScore('invitation:uid', email, function (err, uid) {
				if (err || !uid) return next(err || new Error("Database error uninviting " + email));
				if (parseInt(uid, 10) !== socket.uid) return next(new Error("User not invited by you."));

				Database.sortedSetRemove('invitation:uid', email, next);
			});
		},

		// User reinvite.
		reinvite: function (socket, data, next) {

			if (!socket.uid) return;
			if (!(data && data.email)) return next(new Error("No email to reinvite."));

			var	email = data.email.toLowerCase();

			Database.sortedSetScore('invitation:uid', email, function (err, uid) {
				if (err || !uid) return next(err || new Error("Database error reinviting " + email));
				if (parseInt(uid, 10) !== socket.uid) return next(new Error("User not invited by you."));

				Database.getObjectField('user:' + socket.uid, 'user-reinvite-cooldown', function (err, cooldown) {
					if (err) return next(new Error("Database error reinviting " + email));

					if (!cooldown || cooldown < Date.now()) {
						sendInvite({email: email, from: socket.uid});
						Database.setObjectField('user:' + socket.uid, 'user-reinvite-cooldown', Date.now() + 300000);
						next(null, {sent: [email]});
					}else{
						next(new Error("You must wait 5 minutes before resending an invite."));
					}
				});
			});
		}
	};

	SocketAdmin.invitation = {

		// Check availability of an array of emails and send them.
		send: function (socket, data, next) {

			if (!data || !data.emails || !Array.isArray(data.emails)) return next(new Error('[[fail_bad_data]]'));

			filterEmails(data.emails, function (err, payload) {
				payload.sent.forEach(function(email){
					sendInvite({email: email.toLowerCase()});
				});

				next(null, payload);
			});
		},

		reinvite: function (socket, data, next) {

			if (!(data && data.email)) return next(new Error("No email to reinvite."));

			var email = data.email.toLowerCase();

			sendInvite({email: email});

			next(null, {sent: [email]});

		}

	};

	function render(req, res, next) {
		Groups.getGroupsFromSet('groups:createtime', 0, 0, -1, function(err, groups) {
			if (err) return groups = [];
			groups = groups.filter(function (element, index, array) {
				if (element.name.match('privileges')) return false;
				return true;
			});

			res.render('admin/plugins/newuser-invitation', {groups: groups});
		});
	}

	router.get('/admin/plugins/newuser-invitation', middleware.admin.buildHeader, render);
	router.get('/api/admin/plugins/newuser-invitation', render);

	function renderUserInvitations(req, res, next) {
		User.getUidByUserslug(req.params.user, function(err, uid) {
			if (err || !uid) return res.redirect('/');

			getUserInvites(uid, function (err, renderData) {
				if (err) return res.redirect('/');

				renderData.maxInvites         = UserInvitations.settings.get('defaultInvitations');
				renderData.numInvitesPending  = renderData.invitesPending.length;
				renderData.numInvitesAccepted = renderData.invitesAccepted.length;
				renderData.invitesAvailable   = UserInvitations.settings.get('defaultInvitations') - renderData.numInvitesPending - renderData.numInvitesAccepted;
				renderData.invitesAvailable   = renderData.invitesAvailable < 0 ? 0 : renderData.invitesAvailable;

				renderData.yourprofile = parseInt(uid, 10) === req.uid;

				renderData.invitesPending = renderData.invitesPending.map(function (email) { return {email:email}; });

				res.render('account/invitations', renderData);
			});
		});
	}

	router.get('/user/:user/invitations', middleware.buildHeader, renderUserInvitations);
	router.get('/api/user/:user/invitations', renderUserInvitations);

	var	defaultSettings = {
		defaultInvitations: 10,
		restrictRegistration: 0,
		inviteGroup: 'registered-users',
		invitedUsers: []
	};

	function logSettings() {
		winston.info(prepend("Synced settings:"), UserInvitations.settings.get());
		warnRestriction();
	}

	function warnRestriction() {
		if (!!UserInvitations.settings.get('restrictRegistration')) winston.warn(prepend("Restricting new user registration to invited users only!!!"));
	}

	UserInvitations.settings = new Settings('userinvitations', '1.0.0', defaultSettings, function () {

		logSettings();

		// Import v0.1.0 Settings
		Meta.settings.get('newuser-invitation', function(err, settings) {
			if (err || !settings || !settings.invitedUsers) return;

			winston.info(prepend("Found old invite data, importing..."));

			try {
				var invitedUsers = settings.invitedUsers ? JSON.parse(settings.invitedUsers) : [];
				invitedUsers = UserInvitations.settings.get('invitedUsers').concat(invitedUsers);
				UserInvitations.settings.set('invitedUsers', invitedUsers);
				UserInvitations.settings.persist(function () {
					winston.info(prepend("Successfully imported old invite data! Logging it on the screen..."), UserInvitations.settings.get('invitedUsers'));
					Database.delete('settings:newuser-invitation');
				});
			}catch(e){
				winston.warn(prepend("Error importing old invite data, puking it onto the screen..."), settings);
				winston.warn("", e);
			}
		});

	});

	SocketAdmin.settings.syncUserInvitations = function (socket, data, next) {

		var	diffDefaultInvitations = UserInvitations.settings.get('defaultInvitations');

		UserInvitations.settings.sync(function () {
			logSettings();
			diffDefaultInvitations = UserInvitations.settings.get('defaultInvitations') - diffDefaultInvitations;
			if (diffDefaultInvitations) {
				// Adjust available invitations for each user by diffDefaultInvitations.
			}

			next();
		});
	};

	callback();
};

// Hook: action:user.create
UserInvitations.acceptInvite = function (userData) {

	var	inviteGroup = UserInvitations.settings.get('inviteGroup');

	if (!inviteGroup || !userData.email) return;

	isInvited(userData.email.toLowerCase(), function (err, invited) {

		if (err) return;
		if (invited) Groups.join(inviteGroup, userData.uid);

		var invitedUsers = UserInvitations.settings.get('invitedUsers');

		if (invitedUsers) {
			async.filter(invitedUsers, function (_email, next) {
				next(_email.toLowerCase() !== userData.email.toLowerCase());
			}, function (_invitedUsers) {
				UserInvitations.settings.set('invitedUsers', _invitedUsers);
				UserInvitations.settings.persist();
			});
		}

		Database.sortedSetScore('invitation:uid', userData.email.toLowerCase(), function (err, uid) {
			if (err || !uid) return;
			Database.sortedSetAdd('user:invitedby', uid, userData.uid);
			Database.sortedSetRemove('invitation:uid', userData.email.toLowerCase());
		});
	});

};

// Hook: filter:register.check
UserInvitations.checkInvitation = function (data, next) {

	// We skip invitation checks if no email was provided.
	if (!UserInvitations.settings.get('restrictRegistration') || !data.userData.email) return next(null, data);

	var email = data.userData.email.toLowerCase();

	isInvited(email, function (err, invited) {
		if (err || !invited) return next(new Error('[[invite:not-invited]] ' + email));
		next(null, data);
	});
};

// Hook: static:user.delete
UserInvitations.userDelete = function (data, next) {
	Database.sortedSetRemove('user:invitedby', data.uid);
	next();
};

// Hook: filter:admin.header.build
UserInvitations.admin = {
	menu: function (custom_header, callback) {
		custom_header.plugins.push({
			"route": '/plugins/newuser-invitation',
			"icon": 'fa-check',
			"name": 'User Invitations'
		});

		callback(null, custom_header);
	}
};

// Hook: filter:user.profileLinks
UserInvitations.addProfileLink = function (links, next) {
	links.push({
		id: 'userinvitations',
		public: true,
		route: 'invitations',
		icon: 'fa-envelope',
		name: '[[invite:title]]'
	});
	next(null, links);
};
