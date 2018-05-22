// nodebb-plugin-user-invitations
// Require modules from NodeBB

const nodebb = path => require.main.require(path)

exports.socketIO = nodebb('./src/socket.io')
exports.socketAdmin = nodebb('./src/socket.io/admin')
exports.socketPlugins = nodebb('./src/socket.io/plugins')

exports.db = nodebb('./src/database')
exports.Emailer = nodebb('./src/emailer')
exports.Groups = nodebb('./src/groups')
exports.Meta = nodebb('./src/meta')
exports.Plugins = nodebb('./src/plugins')
exports.Rewards = nodebb('./src/rewards')
exports.Settings = nodebb('./src/settings')
exports.Translator = nodebb('./public/src/modules/translator')
exports.User = nodebb('./src/user')

exports.async = nodebb('async')
exports.nconf = nodebb('nconf')
exports.winston = nodebb('winston')
