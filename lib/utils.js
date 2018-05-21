// Utils

const { async, user } = require('./nodebb')
const { isInvited } = require('./invitations')

exports.filterEmails = (emails, next) => {
  // Make lowercase.
  emails = emails.map(email => email.toLowerCase())

  // Remove duplicates.
  emails = emails.sort().filter((item, pos, ary) => !pos || item != ary[pos - 1])

  // Check availability and if they were already invited.
  async.reduce(emails, {available:[],unavailable:[],error:[]}, (payload, email, next) => {
    async.parallel({
      isInvited: async.apply(isInvited, email),
      available: async.apply(user.email.available, email),
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
