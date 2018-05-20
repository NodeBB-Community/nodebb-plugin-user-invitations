(function(Views){

	"use strict";

	var nodebb      = require('./nodebb');
	var settings    = require('./settings');
	var invitations = require('./invitations');

	var async = require('async');

	Views.init = function (data, callback) {

		var app        = data.app;
		var router     = data.router;
		var middleware = data.middleware;

		router.get('/admin/plugins/user-invitations', middleware.admin.buildHeader, render);
		router.get('/api/admin/plugins/user-invitations', render);

		router.get('/user/:user/invitations', middleware.buildHeader, renderUserInvitations);
		router.get('/api/user/:user/invitations', renderUserInvitations);

		router.get('/ref/:user', middleware.buildHeader, setReferralSession);

		function setReferralSession(req, res, next) {
			res.cookie('ref', req.params.user);
			res.redirect('/');
		}

		function renderUserInvitations(req, res, next) {

			nodebb.user.getUidByUserslug(req.params.user, function(err, uid) {
				if (err || !uid) return res.redirect('/');

				invitations.getUserInvitations(uid, function (err, renderData) {
					if (err) return res.redirect('/');

					nodebb.user.isAdministrator(req.uid, function (err, isAdmin) {
						renderData.admin = isAdmin;

						renderData.maxInvites         = renderData.invitesMax;
						renderData.numInvitesPending  = renderData.invitesPending.length;
						renderData.numInvitesAccepted = renderData.invitesAccepted.length;
						renderData.invitesAvailable   = renderData.invitesMax - renderData.numInvitesPending - renderData.numInvitesAccepted;
						renderData.invitesAvailable   = renderData.invitesAvailable < 0 ? 0 : renderData.invitesAvailable;

						renderData.yourprofile = parseInt(uid, 10) === req.uid;
						renderData.theirid = uid;
						renderData.reflink = `${req.protocol}://${req.headers.host}/ref/${req.params.user}`;

						renderData.viewInvited = renderData.yourprofile || renderData.admin;
						if (renderData.viewInvited) {
							renderData.invitesPending = renderData.invitesPending.map(function (email) { return {email:email}; });
						} else {
							renderData.invitesPending = null;
						}

						res.render('account/invitations', renderData);
					});
				});
			});
		}

		function render(req, res, next) {

			nodebb.groups.getGroupsFromSet('groups:createtime', 0, 0, -1, function(err, groups) {
				if (err) return groups = [];
				groups = groups.filter(function (element, index, array) {
					if (element.name.match('privileges')) return false;
					return true;
				});

				res.render('admin/plugins/user-invitations', {groups: groups});
			});
		}

		callback();
	}

	// Hook: filter:admin.header.build
	Views.adminHeaderBuild = function (custom_header, callback) {

		custom_header.plugins.push({
			"route": '/plugins/user-invitations',
			"icon": 'fa-check',
			"name": 'User Invitations'
		});

		callback(null, custom_header);
	};

	// Hook: filter:user.profileLinks
	Views.userProfileLinks = function (links, next) {

		links.push({
			id: 'userinvitations',
			public: true,
			route: 'invitations',
			icon: 'fa-envelope',
			name: '[[invite:title]]'
		});

		next(null, links);
	};

}(exports));
