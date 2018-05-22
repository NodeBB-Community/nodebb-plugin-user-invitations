// nodebb-plugin-user-invitations
// Settings handling methods.

const { log } = require('./utils')
const { socketAdmin, Meta, Settings } = require('./nodebb')

const defaultSettings = {
  defaultInvitations: 10,
  restrictRegistration: 0,
  inviteGroup: 'registered-users',
  invitedUsers: [],
}

let settings = module.exports = new Settings('userinvitations', '1.0.0', defaultSettings, () => {
  function logSettings () {
    log("Synced settings:")
    console.dir(settings.get())
    warnRestriction()
  }

  function warnRestriction () {
    if (!!settings.get('restrictRegistration')) log("Restricting new user registration to invited users only!!!")
  }

  socketAdmin.settings.syncUserInvitations = (socket, data, next) => {
    let diffDefaultInvitations = settings.get('defaultInvitations')

    settings.sync(() => {
      logSettings()
      diffDefaultInvitations = settings.get('defaultInvitations') - diffDefaultInvitations
      if (diffDefaultInvitations) {
        // TODO: Adjust available invitations for each user by diffDefaultInvitations.
      }

      next()
    })
  }

  logSettings()
})

module.exports.isInvitedByAdmin = (email, next) => {
  email = email.toLowerCase()

  log(`Getting isInvitedByAdmin of ${email}`)

  let invitedUsers = settings.get('invitedUsers')

  if (!!~(invitedUsers ? invitedUsers.indexOf(email) : -1)) return next(null, true)

  next(null, false)
}
