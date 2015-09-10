define('admin/plugins/newuser-invitation', function () {

	console.log("Loading User Invitations...");

	var UserInvitations = { };

	UserInvitations.init = function () {
		require(['settings', 'translator'], function (settings, translator) {

			translator.translate("[[invite:uninvite]]", function (translation) { UserInvitations.strUninvite = translation; });
			translator.translate("[[invite:resend]]",   function (translation) { UserInvitations.strReinvite = translation; });

			UserInvitations.inviteTemplate = ''
			+ '<tr class="invite">'
			+ '<td><span class="email">{{email}}</span></td>'
			+ '<td class="text-right">'
			+ '<button class="user-uninvite btn btn-warning">' + UserInvitations.strUninvite + '</button>'
			+ '<button class="user-reinvite btn btn-success">' + UserInvitations.strReinvite + '</button>'
			+ '</td></tr>';

			function saveInvites() {
				settings.persist('userinvitations', $('#userinvitations'), function () {
					socket.emit('admin.settings.syncUserInvitations');
				});
			}

			// Add the invited user to the invited users table.
			function addInvite(email) {
				$('table').append(UserInvitations.inviteTemplate.replace('{{email}}', email));
			}

			$('#new-user-invite-send').on('click', function (e) {
				e.preventDefault();

				var email = $('#new-user-invite-user').val().toLowerCase().replace(/ /g, ''),
					emails = [],
					matches,
					exists;

				matches = email.match(/[^,"\n\r]*@[^,"\n\r]+\.[^,"\n\r]+/g);

				// Eliminate duplicates.
				$.each(matches, function (i, el) {
					if ($.inArray(el, emails) === -1) emails.push(el);
				});

				emails.forEach(function (email) {
					$('.email').each(function(){
						if ($(this).text().trim() === email) {
							exists = true;
						}
					});

					if (exists) {
						app.alert({
							type: 'warning',
							alert_id: 'newuser-invitation-failed-' + email.replace(/[@\.]/g, '_'),
							title: "User " + email + ' was already invited.',
							timeout: 5000
						});
					}else{
						socket.emit('plugins.invitation.check', {email:email}, function (err) {
							if (!err) {
								addInvite(email);
								saveInvites();

								app.alert({
									type: 'success',
									alert_id: 'newuser-invitation-success-' + email.replace(/[@\.]/g, '_'),
									title: 'Sent invitation to ' + email,
									timeout: 5000
								});
							}else{
								app.alert({
									type: 'danger',
									alert_id: 'newuser-invitation-failed-' + email.replace(/[@\.]/g, '_'),
									title: "Invitation to " + email + " failed.",
									message: err.message,
									timeout: 8000
								});
							}
						});
					}
				});
			});

			function reinvite(email) {
				socket.emit('plugins.invitation.send', {email:email}, function (err) {
					if (!err) {
						app.alert({
							type: 'success',
							alert_id: 'newuser-invitation-success-' + email.replace(/[@\.]/g, '_'),
							title: 'Re-sent invitation to ' + email,
							timeout: 5000
						});
					}else{
						app.alert({
							type: 'danger',
							alert_id: 'newuser-invitation-failed-' + email.replace(/[@\.]/g, '_'),
							title: "Re-invite to " + email + " failed.",
							message: err.message,
							timeout: 8000
						});
					}
				});
			}

			$('#users-container').on('click', '.user-uninvite', function () {
				$(this).closest('tr').remove();
				saveInvites();
			});

			$('#users-container').on('click', '.user-reinvite', function () {
				reinvite($(this).closest('tr').find('.email').text().trim());
			});

			$('#bulk-uninvite').on('click', function() {
				bootbox.confirm("Are you sure? This will uninvite all invited users that have not yet accepted their invitation. This action is not reversible.", function (result) {
					if (result) {
						$('.email').each(function(){
							$(this).closest('tr').remove();
						});
						saveInvites();
					}
				});
			});

			$('#bulk-reinvite').on('click', function() {
				bootbox.confirm("Are you sure? This will reinvite all invited users that have not yet accepted their invitation.", function (result) {
					if (result) {
						$('.email').each(function(){
							reinvite($(this).text().trim());
						});
					}
				});
			});

			settings.registerPlugin({
				types: ['inviteArray'],
				set: function (element, value, trim) {
					value.forEach(addInvite);
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

			$('#restrictRegistration').change(saveInvites);
			$('#save').click(saveInvites);
		});
	}

	return UserInvitations;
});
