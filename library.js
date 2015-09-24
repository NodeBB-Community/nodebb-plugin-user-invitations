"use strict";
(function(UserInvitations, NodeBB){

	var Groups   = NodeBB.require('./groups'),
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
		winston = require('winston');

	function sendInvite(params, group) {
		var url = nconf.get('url') + (nconf.get('url').slice(-1) === '/' ? '' : '/');

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
	}

	function hasEmailer() {
		if (Plugins.hasListeners('action:email.send')) {
			return true;
		} else {
			winston.warn('[UserInvitations] No active email plugin found!');
			return false;
		}
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
				invitedBy: async.apply(Database.sortedSetScore, 'invitation:uid', email),
				available: async.apply(User.email.available, email)
			}, function (err, results) {
				if (err) {
					payload.error.push(email);
					return next();
				}

				if (!results.available || results.invitedBy) {
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

	UserInvitations.init = function(data, callback) {
		winston.info('[User-Invitations] Initializing User-Invitations...');
		hasEmailer();

		var app        = data.app,
			router     = data.router,
			middleware = data.middleware;

		SocketPlugins.invitation = {

			// Check availability of emails and send them.
			send: function (socket, data, next) {
				if (!hasEmailer()) return next(new Error('[[fail_no_emailer]]'));
				if (!data || !data.emails || !Array.isArray(data.emails) || !data.emails.length) return next(new Error('[[fail_bad_data]]'));

				filterEmails(data.emails, function (err, payload) {
					Database.sortedSetCount('invitation:uid', socket.uid, socket.uid, function (err, invites) {
						if (UserInvitations.settings.get('defaultUserInvites') - invites < payload.sent.length) return next(new Error('[[not_enough_invites]]'));

						payload.sent.forEach(function(email){
							sendInvite({email: email, from: socket.uid});
						});
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
						sendInvite({email: email, from: socket.uid});
					});
				});
			}
		};

		function render(req, res, next) {
			res.render('admin/plugins/newuser-invitation', {});
		}

		router.get('/admin/plugins/newuser-invitation', middleware.admin.buildHeader, render);
		router.get('/api/admin/plugins/newuser-invitation', render);

		function renderUserInvitations(req, res, next) {
			User.getUidByUserslug(req.params.user, function(err, uid) {
				if (err || !uid) return res.redirect('/');

				async.parallel({
					invitesPending  : async.apply(Database.getSortedSetRangeByScore, 'invitation:uid', 0, 1, uid, uid),
					invitesAccepted : function (next) {
						Database.getSortedSetRangeByScore('user:invitedby', 0, 1, uid, uid, function (err, uids) {
							User.getUsersData(uids, next);
						});
					}
				}, function (err, renderData) {
					if (err) return res.redirect('/');

					renderData.maxInvites         = UserInvitations.settings.get('defaultInvitations');
					renderData.numInvitesPending  = renderData.invitesPending.length;
					renderData.numInvitesAccepted = renderData.invitesAccepted.length;
					renderData.invitesAvailable   = UserInvitations.settings.get('defaultInvitations') - renderData.invitesPending - renderData.invitesAccepted;
					renderData.invitesAvailable   = renderData.invitesAvailable < 0 ? 0 : renderData.invitesAvailable;

					renderData.yourprofile = parseInt(uid, 10) === req.uid;

					res.render('account/invitations', renderData);
				});
			});
		}

		router.get('/user/:user/invitations', middleware.buildHeader, renderUserInvitations);
		router.get('/api/user/:user/invitations', renderUserInvitations);

		var defaultSettings = {
			defaultInvitations: 10,
			restrictRegistration: 1,
			invitedUsers: []
		};

		function logSettings() {
			winston.info('[User-Invitations] Synced settings:', UserInvitations.settings.get());
			warnRestriction();
		}

		function warnRestriction() {
			if (!!UserInvitations.settings.get('restrictRegistration')) winston.warn('[User-Invitations] Restricting new user registration to invited users only!!!');
		}

		UserInvitations.settings = new Settings('userinvitations', '1.0.0', defaultSettings, function () {
			logSettings();
			UserInvitations.importOldSettings();
		});

		SocketAdmin.settings.syncUserInvitations = function () {
			var diffDefaultInvitations = UserInvitations.settings.get('defaultInvitations');
			UserInvitations.settings.sync(function () {
				logSettings();
				diffDefaultInvitations = UserInvitations.settings.get('defaultInvitations') - diffDefaultInvitations;
				if (diffDefaultInvitations) {
					// Adjust available invitations for each user by diffDefaultInvitations.
				}
			});
		};

		callback();
	};

	UserInvitations.importOldSettings = function () {
		Meta.settings.get('newuser-invitation', function(err, settings) {
			if (err || !settings || !settings.invitedUsers) return;

			winston.info('[User-Invitations] Found old invite data, importing...');

			try {
				var invitedUsers = settings.invitedUsers ? JSON.parse(settings.invitedUsers) : [];
				invitedUsers = UserInvitations.settings.get('invitedUsers').concat(invitedUsers);
				UserInvitations.settings.set('invitedUsers', invitedUsers);
				UserInvitations.settings.persist(function () {
					winston.info('[User-Invitations] Successfully imported old invite data! Logging it on the screen...');
					winston.info('[User-Invitations]', UserInvitations.settings.get('invitedUsers'));
					Database.delete('settings:newuser-invitation');
				});
			}catch(e){
				winston.warn('[User-Invitations] Error importing old invite data, puking it onto the screen...');
				winston.info(settings);
				winston.warn(e);
			}
		});
	};

	UserInvitations.moveUserToGroup = function(userData) {
		if (isInvited(userData.email)) {
			// If invited...
		}else{
			// If not invited...
		}
	};

	function isInvited(email) {
		var invitedUsers = UserInvitations.settings.get('invitedUsers');
		return !!~(invitedUsers ? invitedUsers.indexOf(email.toLowerCase()) : -1);
	}

	function removeInvite(email) {
		var invitedUsers = UserInvitations.settings.get('invitedUsers');
		if (invitedUsers) {
			console.log("REMOVING INVITE:", email);
			async.filter(invitedUsers, function (_email, next) {
				console.log(_email.toLowerCase() !== email.toLowerCase());
				next(_email.toLowerCase() !== email.toLowerCase());
			}, function (_invitedUsers) {
				UserInvitations.settings.set('invitedUsers', _invitedUsers);
				UserInvitations.settings.persist();
			});
		}
	}

	UserInvitations.checkInvitation = function (data, next) {
		if (!UserInvitations.settings.get('restrictRegistration') || isInvited(data.userData.email.toLowerCase())) {
			next(null, data);
		}else{
			next(new Error('[[error:not-invited]] ' + data.userData.email.toLowerCase()));
		}

		removeInvite(data.userData.email);
	};

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

}(module.exports, module.parent));
