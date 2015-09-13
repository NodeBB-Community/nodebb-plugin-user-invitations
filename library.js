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

	function sendInvite(email, group) {
		var url = nconf.get('url') + (nconf.get('url').slice(-1) === '/' ? '' : '/');

		Plugins.fireHook('action:email.send', {
			to: email,
			from: Meta.config['email:from'] || 'no-reply@localhost.lan',
			subject: "Invitation to join " + url,
			html: 'Join us by visiting <a href="' + url + 'register">' + url + 'register</a>',
			plaintext: 'Join us by visiting ' + url + 'register'
		});
	}

	UserInvitations.init = function(data, callback) {
		winston.info('[User-Invitations] Initializing User-Invitations...');

		var app        = data.app,
			router     = data.router,
			middleware = data.middleware;

		SocketPlugins.invitation = {
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
						callback(new Error('[[fail_email_taken]]'));
					}
				});
			},
			send: function (socket, data, callback) {
				sendInvite(data.email);
				callback();
			}
		};

		function render(req, res, next) {
			res.render('admin/plugins/newuser-invitation', {});
		}

		router.get('/admin/plugins/newuser-invitation', middleware.admin.buildHeader, render);
		router.get('/api/admin/plugins/newuser-invitation', render);

		function renderUserInvitations(req, res, next) {
			User.getUidByUserslug(req.params.user, function(err, uid) {
				if (err || !uid || parseInt(uid, 10) !== req.uid) {
					res.render('account/invitations', {});
				}else{
					res.render('account/yourinvitations', {});
				}
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
