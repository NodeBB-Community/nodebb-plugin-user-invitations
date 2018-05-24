// nodebb-plugin-user-invitations
// Socket Admin

const Rewards = require('./rewards')
const backend = require('./backend')
const { filterEmails, sendInvitation } = require('./invitations')
const { async } = require('./nodebb')

exports.send = (socket, data, next) => {
  if (!data || !data.emails || !Array.isArray(data.emails)) return next(new Error('[[fail_bad_data]]'))

  filterEmails(data.emails, function (err, payload) {
    payload.available.forEach(function(email){
      sendInvitation({email: email.toLowerCase()})
    })

    next(null, payload)
  })
}

exports.reinvite = (socket, data, next) => {
  if (!(data && data.email)) return next(new Error("No email to reinvite."))

  var email = data.email.toLowerCase()

  sendInvitation({email: email})

  next(null, {available: [email]})
}

exports.giveReward = (socket, data, next) => Rewards.giveInvitations(data)

exports.setInvites = (socket, {uid, invites}, next) => backend.setInvites(uid, invites)
