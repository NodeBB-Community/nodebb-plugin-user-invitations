// nodebb-plugin-user-invitations
// Utils

const { winston } = require('./nodebb')

exports.log = msg => winston.info(`[User Invitations] ${msg}`)
