var	fs = require('fs'),
    groups = module.parent.require('./groups'),
	winston = module.parent.require('winston'),
	Meta = module.parent.require('./meta'),

	Approval = {},
	nonapprovedUserGroup = null,
    approvedUserGroup = null;

Approval.init = function(params, callback) {
	function render(req, res, next) {
		res.render('admin/plugins/newuser-approval', {});
	}

    Meta.settings.get('newuser-approval', function(err, settings) {
		if (!err && settings && settings.approvedUserGroup && settings.nonapprovedUserGroup) {
			approvedUserGroup = settings.approvedUserGroup;
            nonapprovedUserGroup = settings.nonapprovedUserGroup;
		} else {
			winston.error('[plugins/newuser-approval] User groups not set!');
		}
	});
    
	params.router.get('/admin/plugins/newuser-approval', params.middleware.admin.buildHeader, render);
	params.router.get('/api/admin/plugins/newuser-approval', render);
    
	callback();
};

Approval.moveUserToGroup = function(userData) {
    if (nonapprovedUserGroup != null) {
        groups.join(nonapprovedUserGroup, userData.uid);
    }
};

Approval.admin = {
	menu: function(custom_header, callback) {
		custom_header.plugins.push({
			"route": '/plugins/newuser-approval',
			"icon": 'fa-check',
			"name": 'New User Approval'
		});

		callback(null, custom_header);
	}
};

module.exports = Approval;