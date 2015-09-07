"use strict";

function InviteInit() {
	require(['settings', 'translator'], function (settings, translator) {
		var uninvitedGroup,
			invitedGroup,
			invitedUsers,
			Invite = { };

		translator.translate("[[invite:uninvite]]", function (translation) {
			Invite.strUninvite = translation;
		});

		translator.translate("[[invite:resend]]", function (translation) {
			Invite.strResend = translation;
		});

		function saveInvites() {
			// Use the DOM to determine the new invite list.
			var invitedUsers = [ ];
			$('.user-email').each(function(){
				console.log($(this).html());
				invitedUsers.push($(this).html());
			});

			// Save the invite list and invite groups to the db.
			settings.save('newuser-invitation', $('.newuser-invitation-settings'), function () {
				socket.emit('plugins.invitation.setInvitedUsers', {users: invitedUsers}, function () { });
			});
		}

		// For saving the invite groups.
		$('#save').on('click', function (e) {
			e.preventDefault();

			console.log("aaaa");
			saveInvites();
		});

		// Load the invite list.
		socket.emit('admin.settings.get', { hash: 'newuser-invitation' }, function(err, values) {
			if (err) {
				console.log('Unable to load settings');
			} else {
				$('#users-container').empty();
				if (values.invitedUsers) {
					values.invitedUsers = JSON.parse(values.invitedUsers);
					for (var x = 0; x < values.invitedUsers.length; x++) {
						addInvite(values.invitedUsers[x]);
					}
				}
				//invitedGroup = values.invitedGroup;
				//uninvitedGroup = values.uninvitedGroup;
			}

			// Load the invite groups.
			settings.load('newuser-invitation', $('.newuser-invitation-settings'));
		});

		// Add the invited user to the invited users table.
		function addInvite(email) {
			var html = $('<tr />').attr('class', 'users-invite');

			html.append($('<td />').append($('<span />').attr('class', 'user-email').html(email)));
			html.append($('<td />').attr('class','text-right')
				.append($('<button />').attr('class', 'user-uninvite btn btn-warning').html(Invite.strUninvite))
				.append($('<button />').attr('class', 'user-reinvite btn btn-success').html(Invite.strResend)));

			$('#users-container').append(html);
		}

		$('#new-user-invite-send').on('click', function() {
			var email = $('#new-user-invite-user').val(),
				emails = [],
				matches,
				exists;

			matches = email.match(/[^,"\n\r]*@[^,"\n\r]+\.[^,"\n\r]+/g);

			$.each(matches, function(i, el){
				el = el.replace(/ /g, '');
        el = el.toLowerCase();
				if($.inArray(el, emails) === -1) emails.push(el);
			});

			emails.forEach(function (email) {
				$('.user-email').each(function(){
					if ($(this).html().trim().toLowerCase() === email.toLowerCase()) {
            console.log('exists');
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
			reinvite($(this).closest('tr').find('.user-email').html().trim());
		});

		$('#bulk-uninvite').on('click', function() {
			bootbox.confirm("Are you sure? This will uninvite all invited users that have not yet accepted their invitation. This action is not reversible.", function (result) {
				if (result) {
					$('.user-email').each(function(){
						$(this).closest('tr').remove();
					});

					saveInvites();
				}
			});
		});

		$('#bulk-reinvite').on('click', function() {
			bootbox.confirm("Are you sure? This will reinvite all invited users that have not yet accepted their invitation.", function (result) {
				if (result) {
					$('.user-email').each(function(){
						reinvite($(this).html().trim());
					});
				}
			});
		});
	});
}

define('admin/plugins/newuser-invitation', function () {
	console.log("Loading NewUserInvitation...");
	var Invite = { };

	Invite.init = InviteInit;

	return Invite;
});
