// nodebb-plugin-user-invitations
// Invitations methods.

const backend  = require('./backend')
const Settings = require('./settings')
const { log } = require('./utils')

const { async, nconf, Emailer, Meta, Translator, User } = require('./nodebb')

exports.userDelete = backend.userDelete

// Send invitation email.
exports.sendInvitation = (params, group) => {
  const email        = params.email.toLowerCase()
  const fromUser     = params.from
  const registerLink = nconf.get('url') + '/register'
  const site_title   = Meta.config.title || Meta.config.browserTitle || 'NodeBB'
  const subject      = '[[email:invite, ' + site_title + ']]'

  async.waterfall([
    (next) => {
      if (fromUser) {
        backend.createInvitation(fromUser, email)
        User.getUserField(fromUser, 'username', next)
      } else {
        Translator.translate("[[invite:an-admin]]", username => next(null, username))
      }
    },
    (username, next) => {
      const emailData = {
        site_title: site_title,
        registerLink: registerLink,
        subject: subject,
        username: username,
      }

      Emailer.sendToEmail('invitation', email, Meta.config.defaultLang, emailData, next)
    },
  ], err => {
    if (err) winston.warn(err)
  })
}

exports.getUserInvitations = (uid, next) => {
  async.parallel({
    invitesPending  : async.apply(backend.getInvitesPending, uid),
    invitesAccepted : async.apply(backend.getInvitesAccepted, uid),
    invitesMax      : async.apply(backend.getInvitesMax, uid),
  }, next)
}

exports.isInvited = (email, next) => {
  email = email.toLowerCase()

  async.parallel({
    isInvitedByAdmin : async.apply(Settings.isInvitedByAdmin, email),
    isInvitedByUser  : async.apply(backend.isEmailInvited, email),
  }, (err, results) => {
    next(err, results.isInvitedByAdmin || results.isInvitedByUser)
  })
}

function getInvitedInfo(email, next)
{
  email = email.toLowerCase()
  async.parallel({
    isInvitedByAdmin : async.apply(Settings.isInvitedByAdmin, email),
    isInvitedByUid   : async.apply(backend.getUidFromInvitedEmail, email)
  }, next)
}

// Hook: action.user.loggedIn
exports.loginCheck = (data) => {
  const uid = data.uid
  const req = data.req
  const ref = req.cookies.ref

  async.waterfall([
    (next) => {
        backend.referral({action: 'isMember', value: uid}, next)
    },
    (isMember, next) => {
    if(isMember)
      return next(new Error("Member has already been referred"))
        User.getUserData(uid, next)
    },
    (userInfo, next) => {
        if (userInfo.joindate < +new Date() - 1000 * 60) return next(new Error("Hijack attempt blocked"))
        next()
    },
    (next) => {
        backend.referral({action: 'insert', value: uid}, next)
    },
    (next) => {
        User.getUserField(uid, 'email', next)
    },
    (email, next) => {
        User.getUidByUsername(ref, (e, uid) => {
            {
                next(e, {
                    referral: email,
                    referring: uid
                })
            }
        })
    },
    (data, next) => {
        //allows for unlimited invites via link
        backend.incInvitesMax(data.referring, 1, (error, d) => {
            next(error, data)
        })
    },
    (data, next) => {
        if (data.referring === uid)
            return next(new Error("Cannot refer self"))
        backend.createInvitation(data.referring, data.referral, (e, d) => {
            next(e, data.referral)
        })
    },
  ], (error, email) => {
    if (error)
        return log(error)
    userCreate({
        email: email,
        uid: uid
    })
  })
}

// Hook: action:user.create
exports.userCreate = (userData) => {
  log("Created account for " + userData.email + ", checking invites...")

  var inviteGroup = Settings.get('inviteGroup')

  // TODO: add sso invites.
  if (!userData.email) return log('Skipping userCreate of ' + JSON.stringify(userData))

  userData.email = userData.email.toLowerCase()

  getInvitedInfo(userData.email, function (err, info) {

    log("Results: " + JSON.stringify(info))

    // Return if not invited.
    if (err || !(info.isInvitedByUid || info.isInvitedByAdmin)) return log("User wasn't invited.")

    // Join the invited group.
    Groups.join(inviteGroup, userData.uid)

    if (info.isInvitedByUid) {
      backend.acceptInvitation(userData, function (err, acceptedInvites) {
        Rewards.checkConditionAndRewardUser(info.isInvitedByUid, 'invite/accepted-invitations', function(callback) {
          callback(null, acceptedInvites)
        })
      })
    }

    if (info.isInvitedByAdmin) {
      var invitedUsers = Settings.get('invitedUsers')

      if (invitedUsers) {
        async.filter(invitedUsers, function (_email, next) {
          next(_email.toLowerCase() !== userData.email.toLowerCase())
        }, function (_invitedUsers) {
          Settings.set('invitedUsers', _invitedUsers)
          Settings.persist()
        })
      }
    }
  })
}

// Hook: filter:register.check
exports.registerCheck = (data, next) => {
  // We skip invitation checks if no email was provided.
  if (!Settings.get('restrictRegistration') || !data.userData.email) return next(null, data)

  var email = data.userData.email.toLowerCase()

  exports.isInvited(email, function (err, invited) {
    if (err || !invited) return next(new Error('[[invite:not-invited]] ' + email))
    next(null, data)
  })
}

exports.filterEmails = (emails, next) => {
  // Make lowercase.
  emails = emails.map(email => email.toLowerCase())

  // Remove duplicates.
  emails = emails.sort().filter((item, pos, ary) => !pos || item != ary[pos - 1])

  // Check availability and if they were already invited.
  async.reduce(emails, {available:[],unavailable:[],error:[]}, (payload, email, next) => {
    async.parallel({
      isInvited: async.apply(exports.isInvited, email),
      available: async.apply(User.email.available, email),
    }, (err, results) => {
      if (err) {
        payload.error.push(email)
      } else if (!results.available || results.isInvited) {
        payload.unavailable.push(email)
      } else {
        payload.available.push(email)
      }

      next(null, payload)
    })
  }, next)
}
