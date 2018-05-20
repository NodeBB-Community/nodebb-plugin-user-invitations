// Super-duper function that loads the admin page or the user page.

console.log("User Invitations Loaded")

let UserInvitations = {}

UserInvitations.init = () => {

  // Load settings if on admin page, user pages are loaded in the template render.
  if (UserInvitations.loadSettings) UserInvitations.loadSettings();

  // I don't know why this exists.
  var unavailable = [];

  // User clicked on invite button.
  function sendInvites(e) {

    // Parse emails from the textarea.
    var	emails = $('#new-user-invite-user').val().toLowerCase().replace(/[ \t]/g, "").match(/[^,"\n\r]*@[^,"\n\r]+\.[^,"\n\r]+/g),
      invited = getInvited();

    // Clear unavailable list.
    unavailable = [];

    // Filter emails that are already invited.
    emails = emails.sort().filter(function(email, i, ary) {
      if (invited.indexOf(email) !== -1) {
        if (unavailable.indexOf(email) === -1) unavailable.push(email);
        return false;
      }
      return !i || email !== ary[i - 1];
    });

    socket.emit(UserInvitations.socketSend, {emails:emails}, callbackInvites);
  }

  UserInvitations.alertInvites = function (payload) {
    if (payload.available && payload.available.length) {
      app.alert({
        type: 'success',
        alert_id: 'user-invitations-success',
        title: '[[invite:success-invited]]',
        message: payload.available.join(', '),
        timeout: 15000
      });
    }

    // This just concats emails that were filtered out by the server with emails filtered out by the client.
    payload.unavailable = payload.unavailable ? payload.unavailable.concat(unavailable) : [];
    if (payload.unavailable.length) {
      app.alert({
        type: 'danger',
        alert_id: 'user-invitations-failed',
        title: '[[invite:already-invited]]',
        message: payload.unavailable.join(', '),
        timeout: 15000
      });
    }
  }

  function callbackInvites(err, payload) {

    // Something bad happened, alert the user and don't save.
    if (err) return app.alert({
      type: 'danger',
      alert_id: 'fail-invitations',
      title: '[[invite:failed-invitation]]',
      timeout: 15000
    });

    // Add invites to table.
    UserInvitations.addInvites(payload.available || [], function () {

      // Alert user.
      UserInvitations.alertInvites(payload);

      // Save settings if on admin page.
      if (UserInvitations.saveSettings) UserInvitations.saveSettings();

      // Clear invite textarea.
      $('#new-user-invite-user').val('');

      // Update profile stats list.
      if ($('.invites-available').length) {
        $('.invites-available').text(parseInt($('.invites-available').text()) - payload.available.length);
        $('.invites-pending').text(parseInt($('.invites-pending').text()) + payload.available.length);
      }
    });
  }

  function getInvited() { return $('#pending-invites .email').map(function(){ return $(this).text().replace(/[ \t]/g, ""); }).get(); }

  $('#new-user-invite-send').on('click', sendInvites);
  $('#pending-invites').on('click', '.user-uninvite', function () { UserInvitations.uninvite.call(this); });
  $('#pending-invites').on('click', '.user-reinvite', function () { UserInvitations.reinvite.call(this); });

  $('#bulk-uninvite').on('click', function() {
    bootbox.confirm("Are you sure? This will uninvite all invited users that have not yet accepted their invitation. This action is not reversible.", function (result) {
      if (result) {
        $('.email').each(function(){
          $(this).closest('tr').remove();
        });
        UserInvitations.saveSettings();
      }
    });
  });

  $('#bulk-reinvite').on('click', function() {
    bootbox.confirm("Are you sure? This will reinvite all invited users that have not yet accepted their invitation.", function (result) {
      if (result) {
        socket.emit(UserInvitations.socketSend, {emails:getInvited()}, function (err, payload) {
          UserInvitations.alertInvites(payload);
          UserInvitations.saveSettings();
        });
      }
    });
  });
}

// Admin page.
UserInvitations.adminPage = () => {
	// We load the settings in init()
	UserInvitations.loadSettings = function () {
		require(['settings'], function (settings) {

			UserInvitations.saveSettings = function () {
				settings.persist('userinvitations', $('#userinvitations'), function () {
					socket.emit('admin.settings.syncUserInvitations', {}, function () {

						// Clear invite textarea.
						$('#new-user-invite-user').val('');

					});
				});
			};

			UserInvitations.uninvite = function () {
				$(this).closest('tr').remove();
				UserInvitations.saveSettings();
			};

			UserInvitations.reinvite = function () {
				socket.emit('admin.invitation.reinvite', {email:$(this).closest('tr').find('.email').text().replace(/[ \t]/g, "")}, function (err, payload) {
					UserInvitations.alertInvites(payload);
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

					return values;

				}
			});

			$('#restrictRegistration').change(UserInvitations.saveSettings);
			$('#inviteGroup').change(UserInvitations.saveSettings);
			$('#defaultInvitations').change(UserInvitations.saveSettings);

			console.log("Loading admin settings...");
			settings.sync('userinvitations', $('#userinvitations'));

		});
	};

	UserInvitations.socketSend = 'admin.invitation.send';

	function getInviteTemplate(next) {
		if (UserInvitations.inviteTemplate) {
			next(UserInvitations.inviteTemplate);
		}else{
			require(['translator'], function (translator) {
				translator.translate("[[invite:button-uninvite]]", function (strUninvite) {
					translator.translate("[[invite:button-resend]]", function (strReinvite) {
						next(''
						+ '<tr class="invite">'
						+ '<td><span class="email">{{email}}</span></td>'
						+ '<td class="text-right">'
						+ '<button type="button" class="user-uninvite btn btn-warning">' + strUninvite + '</button>'
						+ '<button type="button" class="user-reinvite btn btn-success">' + strReinvite + '</button>'
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

	UserInvitations.init()
}

// User page.
UserInvitations.userPage = () => {
	UserInvitations.uninvite = function () {
		var that = this;
		socket.emit('plugins.invitation.uninvite', {email: $(this).closest('tr').find('.email').text().replace(/[ \t]/g, "")}, function (err, payload) {
			if (err) return console.log(err);
			$(that).closest('tr').remove();
			$('.invites-available').text(parseInt($('.invites-available').text()) + 1);
			$('.invites-pending').text(parseInt($('.invites-pending').text()) - 1);
		});
	};

	UserInvitations.reinvite = function () {
		socket.emit('plugins.invitation.reinvite', {email: $(this).closest('tr').find('.email').text().replace(/[ \t]/g, "")}, function (err, payload) {
			if (err) return console.log(err);
			UserInvitations.alertInvites(payload);
		});
	};

	UserInvitations.socketSend = 'plugins.invitation.send';

	function getInviteTemplate(next) {
		if (UserInvitations.inviteTemplate) {
			next(UserInvitations.inviteTemplate);
		}else{
			require(['translator'], function (translator) {
				translator.translate("[[invite:button-uninvite]]", function (strUninvite) {
					translator.translate("[[invite:button-resend]]", function (strReinvite) {
						next(''
						+ '<tr class="invite">'
						+ '<td><span class="email">{{email}}</span></td>'
						+ '<td class="text-right">'
						+ '<button type="button" class="user-uninvite btn btn-warning">' + strUninvite + '</button>'
						+ '<button type="button" class="user-reinvite btn btn-success">' + strReinvite + '</button>'
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

	UserInvitations.init()
}

/*globals app*/

$(()=>{
	$('#ui-admin #set-invites').click(setInvites);
	$('#ui-admin #give-reward').click(giveReward);
	$('#reflink').click(() => {
        const $temp = $("<input>");
        $("body").append($temp);
        $temp.val($('#reflink').text()).select();
        document.execCommand("copy");
        $temp.remove();
        app.alert({
            title: 'Success!',
            message: 'Referral link copied to clipboard',
            location: 'left-bottom',
            timeout: 1000,
            type: 'success',
        });
	});

	function setInvites() {
		socket.emit('admin.invitation.setInvites', {uid: ajaxify.data.theirid, invites: $('#ui-admin #set-invites-amount').val()});
	}

	function giveReward() {
		socket.emit('admin.invitation.giveReward', {uid: ajaxify.data.theirid, reward: { numInvitations: $('#ui-admin #give-reward-amount').val() }});
	}
})

$(window).on('action:ajaxify.end', (event, data) => {
  if (data.tpl_url === 'account/invitations') UserInvitations.userPage()
  if (data.tpl_url === 'admin/plugins/user-invitations') UserInvitations.adminPage()
})
