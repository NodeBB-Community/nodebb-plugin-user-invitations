"use strict";
(function(){

	var	fs      = require('fs'),
		groups  = module.parent.require('./groups'),
		winston = module.parent.require('winston'),
		Meta    = module.parent.require('./meta'),
		Sockets = module.parent.require('./socket.io/plugins'),
		User    = module.parent.require('./user'),
		Emailer = module.parent.require('./emailer'),
		Plugins = module.parent.require('./plugins'),
		nconf   = module.parent.require('nconf'),

		Invitation = {},
		invitedUsers = [];

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
				subject: "Invitation to join the group " + '' + " at " + url,
				html: 'Join the group ' + '' + ' by visiting <a href="' + url + 'invitation/' + email + '">' + url + 'invitation/' + email + '</a>',
				plaintext: 'Join the group ' + '' + ' by visiting ' + url + 'invitation/' + email,
			});
		}
	}

	Invitation.init = function(data, callback) {
		var app        = data.app,
			router     = data.router,
			middleware = data.middleware;

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
						callback(new Error('[[fail_email_taken]]'));
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
				sendInvite(data.email);
				callback();
			}
		};

		function render(req, res, next) {
			res.render('admin/plugins/newuser-invitation', {});
		}

		Invitation.sync();

		router.get('/admin/plugins/newuser-invitation', middleware.admin.buildHeader, render);
		router.get('/api/admin/plugins/newuser-invitation', render);

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

			winston.warn('[plugins/newuser-invitation] Restricting new user registration to invited users only!!!');
		});
	};

	Invitation.moveUserToGroup = function(userData) {
		var invited = !!~(invitedUsers ? invitedUsers.indexOf(userData.email.toLowerCase()) : -1);

		// If invited...
		if (invited) {
		// If not invited...
		}else{
		}
	};

	Invitation.checkInvitation = function (data, next) {
		Invitation.sync();

		// Don't restrict registration if invite groups are set.
		if (settings) return next(null, data);

		var invited = !!~(invitedUsers ? invitedUsers.indexOf(data.userData.email.toLowerCase()) : -1);

		if (invited) {
			invitedUsers.splice(invited, 1);
			Meta.settings.setOne('newuser-invitation', 'invitedUsers', JSON.stringify(invitedUsers));
			return next(null, data);
		}else{
			return next(new Error('[[error:not-invited]] ' + data.userData.email.toLowerCase()));
		}
	};

	Invitation.admin = {
		menu: function (custom_header, callback) {
			custom_header.plugins.push({
				"route": '/plugins/newuser-invitation',
				"icon": 'fa-check',
				"name": 'New User Invitation'
			});

			callback(null, custom_header);
		}
	};

	module.exports = Invitation;

}(module));
