(function(Emailer){

	"use strict";

	Emailer.send = function (params, group) {

		var	email        = params.email.toLowerCase(),
			fromUser     = params.from,
			registerLink = nconf.get('url') + '/register',
			site_title   = Meta.config.title || Meta.config.browserTitle || 'NodeBB',
			subject      = '[[email:invite, ' + site_title + ']]';

		async.waterfall([
			function(next) {
				if (fromUser) {
					backend.createInvitation(fromUser, email);
					User.getUserField(fromUser, 'username', next);
				}else{
					translator.translate("[[invite:an-admin]]", function(username) {
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

				Emailer.sendToEmail('invitation', email, Meta.config.defaultLang, emailData, next);

			}
		], function (err) {
			if (err) winston.warn(err);
		});

	};

}(exports));
