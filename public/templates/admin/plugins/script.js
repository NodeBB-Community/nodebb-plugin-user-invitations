"use strict";

var nonApprovedGroupName,
	uninvitedGroup,
	invitedGroup,
	invitedUsers,
	approvedGroupName;

	socket.emit('admin.settings.get', { hash: 'newuser-invitation' }, function(err, values) {
		if (err) {
			console.log('Unable to load settings');
		} else {
			invitedUsers = JSON.parse(values.invitedUsers);
			invitedGroup = values.invitedGroup;
			uninvitedGroup = values.uninvitedGroup;
			nonApprovedGroupName = values.nonapprovedUserGroup;
			approvedGroupName = values.approvedUserGroup;
		}
	});

require(['settings'], function(Settings) {
	Settings.load('newuser-invitation', $('.newuser-invitation-settings'), function(){
		//console.log(parameters);
	});

	$('#save').on('click', function() {
		saveInvites();
	});
});

function saveInvites() {
	require(['settings'], function(Settings) {
		var invitedUsers = [ ];
		$('.user-email').each(function(){
			invitedUsers.push($(this).html());
			console.log(invitedUsers);
		});
		Settings.save('newuser-invitation', $('.newuser-invitation-settings'), function() {
			socket.emit('plugins.invitation.setInvitedUsers', {users: invitedUsers}, function () {
				app.alert({
					type: 'success',
					alert_id: 'newuser-invitation-saved',
					title: 'Settings Saved',
					message: 'Click here to reload NodeBB',
					timeout: 2500,
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	});
}

$('#new-user-invite-send').on('click', function() {
	var email = $('#new-user-invite-user').val(), exists;

	$('.user-email').each(function(){
		if ($(this).html().trim() === email) {
			app.alert({
				type: 'danger',
				alert_id: 'newuser-invitation-failed',
				title: 'Failed Email',
				message: 'User already invited.',
				timeout: 2500
			});
			exists = true;
		}
	});

	if (exists || email.indexOf('@') < 0 || email.indexOf('.') < 0) {
		app.alert({
			type: 'danger',
			alert_id: 'newuser-invitation-failed',
			title: 'Failed Invitation',
			message: "Invalid Email",
			timeout: 2500
		});
		return;
	}

	socket.emit('plugins.invitation.check', {email:email}, function (err) {
		console.log('back');
		if (!err) {
			var html = $('<div />').attr('class', 'users-invite');
			html.append($('<span />').attr('class', 'user-email').html(email));
						html.append($('<button />').attr('class', 'user-uninvite btn btn-sm btn-warning').html("Uninvite"));
			$('#users-container').append(html);
			saveInvites();
			app.alert({
				type: 'success',
				alert_id: 'newuser-invitation-success',
				title: 'Sent Invitation',
				message: 'Sent email to ' + email,
				timeout: 2500
			});
		}else{
			app.alert({
				type: 'danger',
				alert_id: 'newuser-invitation-failed',
				title: 'Failed Invitation',
				message: err.message,
				timeout: 2500
			});
		}
	});
});

$('#users-container').on('click', '.user-uninvite', function () {
	$(this).parent().remove();
});

$(document).ready(function() {
	$(window).on('action:ajaxify.end', function(event, data) {
		socket.emit('admin.settings.get', { hash: 'newuser-invitation' }, function(err, values) {
			if (err) {
				console.log('Unable to load settings');
			} else {
				$('#users-container').empty();
				if (values.invitedUsers) {
					values.invitedUsers = JSON.parse(values.invitedUsers);
					for (var x = 0; x < values.invitedUsers.length; x++) {
						var html = $('<div />').attr('class', 'users-invite');
						html.append($('<span />').attr('class', 'user-email').html(values.invitedUsers[x]));
						html.append($('<button />').attr('class', 'user-uninvite btn btn-sm btn-warning').html("Uninvite"));
						$('#users-container').append(html);
					}
				}
			}
		});
	});
});
