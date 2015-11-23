"use strict";

var	NodeBB   = module.parent,
	Groups   = NodeBB.require('./groups'),
	Meta     = NodeBB.require('./meta'),
	User     = NodeBB.require('./user'),
	Emailer  = NodeBB.require('./emailer'),
	Plugins  = NodeBB.require('./plugins'),
	Database = NodeBB.require('./database'),

	Settings      = NodeBB.require('./settings'),
	SocketAdmin   = NodeBB.require('./socket.io/admin'),
	SocketPlugins = NodeBB.require('./socket.io/plugins'),

	fs      = require('fs'),
	async   = require('async'),
	nconf   = require('nconf'),
	winston = require('winston'),

	UserInvitations = module.exports;

function prepend(msg) { return "[User-Invitations] " + msg; }

function isInvitedByAdmin(email, next) {
	var invitedUsers = UserInvitations.settings.get('invitedUsers');
	if (!!~(invitedUsers ? invitedUsers.indexOf(email.toLowerCase()) : -1)) return next(null, true);
	next(null, false);
}

function isInvitedByUser(email, next) {
	Database.isSortedSetMember('invitation:uid', email.toLowerCase(), next);
}

// Hook: static:app.load
UserInvitations.init = function(data, callback) {

	winston.info(prepend("Initializing User-Invitations..."));

	var	app        = data.app,
		router     = data.router,
		middleware = data.middleware;

	// Log emailer availability.
	function hasEmailer() { return Plugins.hasListeners('action:email.send'); }
	if (hasEmailer()) winston.warn(prepend("No active email plugin found!"));

	// Send email and update database.
	function sendInvite(params, group) {
		var	url = nconf.get('url') + (nconf.get('url').slice(-1) === '/' ? '' : '/');

		Plugins.fireHook('action:email.send', {
			to: params.email,
			from: Meta.config['email:from'] || 'no-reply@localhost.lan',
			from_name: Meta.config['email:from_name'] || 'NodeBB',
			subject: "Invitation to join " + url,
			html: 'Join us by visiting <a href="' + url + 'register">' + url + 'register</a>',
			plaintext: 'Join us by visiting ' + url + 'register',
			uid: 'none, email: ' + params.email,
			template: "New User Invitation"
		});

		if (params.from) Database.sortedSetAdd('invitation:uid', params.from, params.email.toLowerCase());
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
				isInvitedByAdmin: async.apply(isInvitedByAdmin, email),
				isInvitedByUser: async.apply(isInvitedByUser, email),
				available: async.apply(User.email.available, email)
			}, function (err, results) {
				if (err) {
					payload.error.push(email);
					return next();
				}

				if (!results.available || results.isInvitedByAdmin || results.isInvitedByUser) {
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
			if (!hasEmailer()) return next(new Error('[[fail_no_emailer]]'));
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
			if (!hasEmailer()) return next(new Error('[[fail_no_emailer]]'));
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
			if (!hasEmailer()) return next(new Error('[[fail_no_emailer]]'));
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

			if (!hasEmailer()) return next(new Error('[[fail_no_emailer]]'));
			if (!data || !data.emails || !Array.isArray(data.emails)) return next(new Error('[[fail_bad_data]]'));

			filterEmails(data.emails, function (err, payload) {
				payload.sent.forEach(function(email){
					sendInvite({email: email.toLowerCase()});
				});

				next(null, payload);
			});
		},

		reinvite: function (socket, data, next) {

			if (!hasEmailer()) return next(new Error('[[fail_no_emailer]]'));
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
	if (!inviteGroup) return;

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

	if (!UserInvitations.settings.get('restrictRegistration')) return next(null, data);

	var email = data.userData.email.toLowerCase();

	isInvited(email, function (err, invited) {
		if (err || !invited) return next(new Error('[[error:not-invited]] ' + email));
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
		name: 'Invitations'
	});
	next(null, links);
};
