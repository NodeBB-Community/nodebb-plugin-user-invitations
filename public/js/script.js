var UserInvitations = function () {
	console.log("Loading User Invitations...");

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
	UserInvitations.addInvite = function (email) {
		getInviteTemplate(function(inviteTemplate){
			$('#pending-invites').append(inviteTemplate.replace('{{email}}', email));
		});
	};

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

			socket.emit(UserInvitations.socketSend, {emails:emails}, callbackInvites);
		}

		function addInvites(emails) {
			emails.forEach(function(email){
				UserInvitations.addInvite(email);
			});
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
			alertInvites(payload);
			UserInvitations.saveInvites();

			// Add invites to table.
			addInvites(payload.sent);

			// Clear unavailable list.
			unavailable = [];
		}

		function getInvited() { return $('#pending-invites .email').map(function(){ return $(this).text().replace(/[ \t]/g, ""); }).get(); }

		$('#new-user-invite-send').on('click', sendInvites);

		$('#users-container').on('click', '.user-uninvite', function () {
			$(this).closest('tr').remove();
			UserInvitations.saveInvites();
		});

		$('#users-container').on('click', '.user-reinvite', function () {
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
				socket.emit('admin.settings.syncUserInvitations');
			});
		};

		settings.registerPlugin({
			types: ['inviteArray'],
			set: function (element, value, trim) {
				value.forEach(UserInvitations.addInvite);
			},
			get: function (element, trim, empty) {
				var key = element.data('key'),
					values = [];

				$('.invite').each(function () {
					values.push($(this).find('.email').text());
				});

				return values;
			}
		});

		settings.sync('userinvitations', $('#userinvitations'));

		$('#restrictRegistration').change(UserInvitations.saveInvites);
	});

	UserInvitations.socketSend = 'admin.invitation.send';

	return UserInvitations();
});

define('profile/invitations', function () {
	console.log("here");
	UserInvitations.saveInvites = function () {
		socket.emit('plugins.invitation.syncUserInvitations', {});
	};

	UserInvitations.socketSend = 'plugins.invitation.send';

	UserInvitations().init();
});
