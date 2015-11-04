var	UserInvitations = function () {

	console.log("Loading User Invitations...");

	UserInvitations.init = function () {

		var unavailable = [];

		function sendInvites(e) {
			e.preventDefault();

			var emails = $('#new-user-invite-user').val().toLowerCase().replace(/[ \t]/g, "").match(/[^,"\n\r]*@[^,"\n\r]+\.[^,"\n\r]+/g),
				invited = getInvited();

			emails = emails.sort().filter(function(email, i, ary) {
				if (invited.indexOf(email) !== -1) {
					if (unavailable.indexOf(email) === -1) unavailable.push(email);
					return false;
				}
				return !i || email !== ary[i - 1];
			});

			console.log("Sending e-mails:", emails);

			socket.emit(UserInvitations.socketSend, {emails:emails}, callbackInvites);
		}

		function alertInvites(payload) {
			if (payload.sent.length) {
				app.alert({
					type: 'success',
					alert_id: 'newuser-invitation-success',
					title: "Sent Invitation(s)",
					message: payload.sent.join(', '),
					timeout: 15000
				});
			}

			if (payload.unavailable.length || unavailable.length) {
				app.alert({
					type: 'danger',
					alert_id: 'newuser-invitation-failed',
					title: "Already Invited",
					message: payload.unavailable.concat(unavailable).join(', '),
					timeout: 15000
				});
			}
		}

		function callbackReinvites(err, payload) {
			alertInvites(payload);
			UserInvitations.saveInvites();
		}

		function callbackInvites(err, payload) {
			// Add invites to table.
			UserInvitations.addInvites(payload.sent || [], function () {
				// Alert user.
				alertInvites(payload);

				// Save to database.
				UserInvitations.saveInvites();
			});
		}

		function getInvited() { return $('#pending-invites .email').map(function(){ return $(this).text().replace(/[ \t]/g, ""); }).get(); }

		$('#new-user-invite-send').on('click', sendInvites);

		$('#pending-invites').on('click', '.user-uninvite', function () {
			$(this).closest('tr').remove();
			UserInvitations.saveInvites();
		});

		$('#pending-invites').on('click', '.user-reinvite', function () {
			socket.emit(UserInvitations.socketSend, {emails:[$(this).closest('tr').find('.email').text().replace(/[ \t]/g, "")]}, callbackReinvites);
		});

		$('#bulk-uninvite').on('click', function() {
			bootbox.confirm("Are you sure? This will uninvite all invited users that have not yet accepted their invitation. This action is not reversible.", function (result) {
				if (result) {
					$('.email').each(function(){
						$(this).closest('tr').remove();
					});
					UserInvitations.saveInvites();
				}
			});
		});

		$('#bulk-reinvite').on('click', function() {
			bootbox.confirm("Are you sure? This will reinvite all invited users that have not yet accepted their invitation.", function (result) {
				if (result) {
					socket.emit(UserInvitations.socketSend, {emails:getInvited()}, callbackReinvites);
				}
			});
		});
	};

	return UserInvitations;
};

define('admin/plugins/newuser-invitation', function () {

	require(['settings'], function (settings) {

		UserInvitations.saveInvites = function () {
			settings.persist('userinvitations', $('#userinvitations'), function () {
				socket.emit('admin.settings.syncUserInvitations', {}, function () {
					// Clear unavailable list.
					unavailable = [];

					// Clear invite textarea.
					$('#new-user-invite-user').val('');
				});
			});
		};

		settings.registerPlugin({
			types: ['inviteArray'],
			set: function (element, value, trim) {
				UserInvitations.addInvites(value || []);
			},
			get: function (element, trim, empty) {

				var	values = [];

				$('.invite').each(function () {
					values.push($(this).find('.email').text());
				});

				console.log("Saw values:", values);

				return values;
			}
		});

		settings.sync('userinvitations', $('#userinvitations'));

		$('#restrictRegistration').change(UserInvitations.saveInvites);
		$('#inviteGroup').change(UserInvitations.saveInvites);

	});

	UserInvitations.socketSend = 'admin.invitation.send';

	function getInviteTemplate(next) {
		if (UserInvitations.inviteTemplate) {
			next(UserInvitations.inviteTemplate);
		}else{
			require(['translator'], function (translator) {
				translator.translate("[[invite:uninvite]]", function (strUninvite) {
					translator.translate("[[invite:resend]]", function (strReinvite) {
						next(''
						+ '<tr class="invite">'
						+ '<td><span class="email">{{email}}</span></td>'
						+ '<td class="text-right">'
						+ '<button class="user-uninvite btn btn-warning">' + strUninvite + '</button>'
						+ '<button class="user-reinvite btn btn-success">' + strReinvite + '</button>'
						+ '</td></tr>');
					});
				});
			});
		}
	}

	// Add the invited user to the invited users table.
	UserInvitations.addInvites = function (emails, next) {
		getInviteTemplate(function(inviteTemplate){
			if (Array.isArray(emails)) {
				emails.forEach(function (email) {
					$('#pending-invites').append(inviteTemplate.replace('{{email}}', email));
				});
			} else {
				$('#pending-invites').append(inviteTemplate.replace('{{email}}', emails));
			}

			if (typeof next === 'function') next();
		});
	};

	return UserInvitations();
});

define('profile/invitations', function () {
	UserInvitations.saveInvites = function () {
		socket.emit('plugins.invitation.syncUserInvitations', {}, function () {
			// Clear unavailable list.
			unavailable = [];

			// Clear invite textarea.
			$('#new-user-invite-user').val('');
		});
	};

	UserInvitations.socketSend = 'plugins.invitation.send';

	function getInviteTemplate(next) {
		if (UserInvitations.inviteTemplate) {
			next(UserInvitations.inviteTemplate);
		}else{
			require(['translator'], function (translator) {
				translator.translate("[[invite:uninvite]]", function (strUninvite) {
					translator.translate("[[invite:resend]]", function (strReinvite) {
						next(''
						+ '<tr class="invite">'
						+ '<td><span class="email">{{email}}</span></td>'
						+ '<td class="text-right">'
						+ '<button class="user-uninvite btn btn-warning">' + strUninvite + '</button>'
						+ '<button class="user-reinvite btn btn-success">' + strReinvite + '</button>'
						+ '</td></tr>');
					});
				});
			});
		}
	}

	// Add the invited user to the invited users table.
	UserInvitations.addInvites = function (emails, next) {
		getInviteTemplate(function(inviteTemplate){
			if (Array.isArray(emails)) {
				emails.forEach(function (email) {
					$('#pending-invites').append(inviteTemplate.replace('{{email}}', email));
				});
			} else {
				$('#pending-invites').append(inviteTemplate.replace('{{email}}', emails));
			}

			if (typeof next === 'function') next();
		});
	};

	UserInvitations().init();

});
