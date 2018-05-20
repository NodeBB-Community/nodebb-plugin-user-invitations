(function(Invitations){

	"use strict"

	var backend  = require('./backend');
	var emailer  = require('./emailer');
	var logger   = require('./logger');
	var nodebb   = require('./nodebb');
	var settings = require('./settings');
	var rewards  = require('./rewards');

	const { async, nconf } = nodebb

	Invitations.sendInvitation     = sendInvitation;     // Send invitation email.
	Invitations.getUserInvitations = getUserInvitations; // Get a user's accepted and pending invitations as an object.
	Invitations.isInvited          = isInvited;

	Invitations.setInvites = function (socket, data, next) {
		backend.setInvites(data.uid, data.invites);
	};
	Invitations.giveReward = function (socket, data, next) {
		rewards.giveInvitations(data);
	};

	// Invitations.userInvitationsInc = addUserInvitations;    // Give a user more invitations to send.
	// Invitations.userInvitationsDec = removeUserInvitations; // Give a user less invitations to send.
	// Invitations.userInvitationsSet =	userInvitationsSet;    // Set the numb

	// Hooks
	Invitations.registerCheck = registerCheck;
	Invitations.loginCheck    = loginCheck;
	Invitations.userCreate    = userCreate;
	Invitations.userDelete    = backend.userDelete;

	Invitations.socketio = {
		userSend      : userSend,
		userReinvite  : userReinvite,
		userUninvite  : userUninvite,
		adminSend     : adminSend,
		adminReinvite : adminReinvite
	};

	function sendInvitation(params, group)
	{
		var	email        = params.email.toLowerCase(),
			fromUser     = params.from,
			registerLink = nconf.get('url') + '/register',
			site_title   = nodebb.meta.config.title || nodebb.meta.config.browserTitle || 'NodeBB',
			subject      = '[[email:invite, ' + site_title + ']]';

		async.waterfall([
			function(next) {
				if (fromUser) {
					backend.createInvitation(fromUser, email);
					nodebb.user.getUserField(fromUser, 'username', next);
				}else{
					nodebb.translator.translate("[[invite:an-admin]]", function(username) {
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

				nodebb.emailer.sendToEmail('invitation', email, nodebb.meta.config.defaultLang, emailData, next);

			}
		], function (err) {
			if (err) logger.log(err);
		});
	}

	function getUserInvitations(uid, next)
	{
		async.parallel({
			invitesPending  : async.apply(backend.getInvitesPending,  uid),
			invitesAccepted : async.apply(backend.getInvitesAccepted, uid),
			invitesMax      : async.apply(backend.getInvitesMax,      uid)
		}, next);
	}

	function isInvited(email, next)
	{
		email = email.toLowerCase();
		async.parallel({
			isInvitedByAdmin : async.apply(settings.isInvitedByAdmin, email),
			isInvitedByUser  : async.apply(backend.isEmailInvited, email)
		}, function (err, results) {
			next(err, results.isInvitedByAdmin || results.isInvitedByUser);
		});
	}

	function getInvitedInfo(email, next)
	{
		email = email.toLowerCase();
		async.parallel({
			isInvitedByAdmin : async.apply(settings.isInvitedByAdmin, email),
			isInvitedByUid   : async.apply(backend.getUidFromInvitedEmail, email)
		}, next);
	}

	// Hook: action.user.loggedIn
    function loginCheck(data) {
        const uid = data.uid;
        const req = data.req;
        const ref = req.cookies.ref;

        async.waterfall([
            (next) => {
                backend.referral({action: 'isMember', value: uid}, next);
            },
            (isMember, next) => {
        		if(isMember)
        			return next(new Error("Member has already been referred"));
                nodebb.user.getUserData(uid, next);
            },
            (userInfo, next) => {
                if (userInfo.joindate < +new Date() - 1000 * 60)
                    return next(new Error("Hijack attempt blocked"));
                next();
            },
            (next) => {
                backend.referral({action: 'insert', value: uid}, next);
            },
            (next) => {
                nodebb.user.getUserField(uid, 'email', next);
            },
            (email, next) => {
                nodebb.user.getUidByUsername(ref, (e, uid) => {
                    {
                        next(e, {
                            referral: email,
                            referring: uid
                        });
                    }
                });
            },
            (data, next) => {
                //allows for unlimited invites via link
                backend.incInvitesMax(data.referring, 1, (error, d) => {
                    next(error, data);
                });
            },
            (data, next) => {
                if (data.referring === uid)
                    return next(new Error("Cannot refer self"));
                backend.createInvitation(data.referring, data.referral, (e, d) => {
                    next(e, data.referral);
                });
            },
        ], (error, email) => {
            if (error)
                return logger.log(error);
            userCreate({
                email: email,
                uid: uid
            });

        });
    }

	// Hook: action:user.create
	function userCreate(userData)
	{
		logger.log("Created account for " + userData.email + ", checking invites...");

		var	inviteGroup = settings.get('inviteGroup');

		// TODO: add sso invites.
		if (!userData.email) return logger.log('Skipping userCreate of ' + JSON.stringify(userData));

		userData.email = userData.email.toLowerCase();

		getInvitedInfo(userData.email, function (err, info) {

			logger.log("Results: " + JSON.stringify(info));

			// Return if not invited.
			if (err || !(info.isInvitedByUid || info.isInvitedByAdmin)) return logger.log("User wasn't invited.");

			// Join the invited group.
			nodebb.groups.join(inviteGroup, userData.uid);

			if (info.isInvitedByUid) {
				backend.acceptInvitation(userData, function (err, acceptedInvites) {
					nodebb.rewards.checkConditionAndRewardUser(info.isInvitedByUid, 'invite/accepted-invitations', function(callback) {
						callback(null, acceptedInvites);
					});
				});
			}

			if (info.isInvitedByAdmin) {
				var invitedUsers = settings.get('invitedUsers');

				if (invitedUsers) {
					async.filter(invitedUsers, function (_email, next) {
						next(_email.toLowerCase() !== userData.email.toLowerCase());
					}, function (_invitedUsers) {
						settings.set('invitedUsers', _invitedUsers);
						settings.persist();
					});
				}
			}
		});
	}

	// Hook: filter:register.check
	function registerCheck(data, next)
	{
		// We skip invitation checks if no email was provided.
		if (!settings.get('restrictRegistration') || !data.userData.email) return next(null, data);

		var email = data.userData.email.toLowerCase();

		isInvited(email, function (err, invited) {
			if (err || !invited) return next(new Error('[[invite:not-invited]] ' + email));
			next(null, data);
		});
	}

	//////////////

	function userSend(socket, data, next)
	{
		// Guests can't send invites.
		if (!socket.uid) return;

		// Assert parameters.
		if (!data || !data.emails || !Array.isArray(data.emails) || !data.emails.length) return next(new Error('[[fail_no_emails]]'));

		// Sort emails and convert to lowercase.
		filterEmails(data.emails, function (err, payload) {

			// Check that the user has enough available invites to send the new invitations.
			getUserInvitations(socket.uid, function (err, invites) {

				if (err) return next(new Error('[[fail_db]]'));

				backend.getInvitesMax(socket.uid, function (err, invitesMax) {

					if (err) return next(new Error('[[fail_db]]'));

					if (invitesMax - invites.invitesPending.length - invites.invitesAccepted.length < payload.available.length) return next(new Error('[[not_enough_invites]]'));

					payload.available.forEach(function(email){
						sendInvitation({email: email, from: socket.uid});
					});

					// Send the results back to the client.
					next(null, payload);
				});
			});
		});
	};

	function userUninvite(socket, data, next)
	{
		if (!socket.uid) return;
		if (!(data && data.email)) return next(new Error("No email to uninvite."));

		var	email = data.email.toLowerCase();

		nodebb.db.sortedSetScore('invitation:uid', email, function (err, uid) {
			if (err || !uid) return next(err || new Error("Database error uninviting " + email));
			if (parseInt(uid, 10) !== socket.uid) return next(new Error("User not invited by you."));

			nodebb.db.sortedSetRemove('invitation:uid', email, next);
		});
	};

	function userReinvite(socket, data, next)
	{
		if (!socket.uid) return;
		if (!(data && data.email)) return next(new Error("No email to reinvite."));

		var	email = data.email.toLowerCase();

		nodebb.db.sortedSetScore('invitation:uid', email, function (err, uid) {
			if (err || !uid) return next(err || new Error("Database error reinviting " + email));
			if (parseInt(uid, 10) !== socket.uid) return next(new Error("User not invited by you."));

			nodebb.db.getObjectField('user:' + socket.uid, 'user-reinvite-cooldown', function (err, cooldown) {
				if (err) return next(new Error("Database error reinviting " + email));

				if (!cooldown || cooldown < Date.now()) {
					sendInvitation({email: email, from: socket.uid});
					nodebb.db.setObjectField('user:' + socket.uid, 'user-reinvite-cooldown', Date.now() + 300000);
					next(null, {available: [email]});
				}else{
					next(new Error("You must wait 5 minutes before resending an invite."));
				}
			});
		});
	};

	// Check availability of an array of emails and send them.
	function adminSend(socket, data, next)
	{
		if (!data || !data.emails || !Array.isArray(data.emails)) return next(new Error('[[fail_bad_data]]'));

		filterEmails(data.emails, function (err, payload) {
			payload.available.forEach(function(email){
				sendInvitation({email: email.toLowerCase()});
			});

			next(null, payload);
		});
	};

	function adminReinvite(socket, data, next)
	{
		if (!(data && data.email)) return next(new Error("No email to reinvite."));

		var email = data.email.toLowerCase();

		sendInvitation({email: email});

		next(null, {available: [email]});
	};

	////////////////

	function filterEmails(emails, next)
	{
		var payload = {available:[],unavailable:[],error:[]};

		// Make lowercase.
		for (var i = 0; i < emails.length; i++) emails[i] = emails[i].toLowerCase();

		// Remove duplicates.
		emails = emails.sort().filter(function(item, pos, ary) {
			return !pos || item != ary[pos - 1];
		});

		// Check availability and if they were already invited.
		async.each(emails, function (email, next) {

			async.parallel({
				isInvited: async.apply(isInvited, email),
				available: async.apply(nodebb.user.email.available, email)
			}, function (err, results) {

				if (err)
				{
					payload.error.push(email);
				}
				else if (!results.available || results.isInvited)
				{
					payload.unavailable.push(email);
				}
				else
				{
					payload.available.push(email);
				}

				return next();
			});
		}, function(){
			next(null, payload);
		});
	}

}(exports));
