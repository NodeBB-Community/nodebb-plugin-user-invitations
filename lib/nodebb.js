(function(nodebb, nbb){

	"use strict";

	nodebb.socketIO      = nbb('./src/socket.io');
	nodebb.socketAdmin   = nbb('./src/socket.io/admin');
	nodebb.socketPlugins = nbb('./src/socket.io/plugins');

	nodebb.db       = nbb('./src/database');
	nodebb.emailer  = nbb('./src/emailer');
	nodebb.groups   = nbb('./src/groups');
	nodebb.meta     = nbb('./src/meta');
	nodebb.plugins  = nbb('./src/plugins');
	nodebb.rewards  = nbb('./src/rewards');
	nodebb.settings = nbb('./src/settings');
	nodebb.user     = nbb('./src/user');

	try {
		nodebb.translator = nbb('../public/src/modules/translator');
		nodebb.legacy = false;
	}catch(e){
		nodebb.translator = nbb('../public/src/translator');
		nodebb.legacy = true;
	}

}(exports, require.main.require));
