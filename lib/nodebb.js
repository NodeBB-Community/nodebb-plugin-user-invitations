// Require modules from NodeBB

const nodebb = path => require.main.require(path)

exports.socketIO = nodebb('./src/socket.io')
exports.socketAdmin = nodebb('./src/socket.io/admin')
exports.socketPlugins = nodebb('./src/socket.io/plugins')

exports.db = nodebb('./src/database')
exports.emailer = nodebb('./src/emailer')
exports.groups = nodebb('./src/groups')
exports.meta = nodebb('./src/meta')
exports.plugins = nodebb('./src/plugins')
exports.rewards = nodebb('./src/rewards')
exports.settings = nodebb('./src/settings')
exports.translator = nodebb('./public/src/modules/translator')
exports.user = nodebb('./src/user')

exports.async = nodebb('async')
exports.nconf = nodebb('nconf')
