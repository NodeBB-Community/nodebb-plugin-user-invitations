// nodebb-plugin-user-invitations
// Rewards hooks.

const backend = require('./backend')
const { log } = require('./utils')

exports.get = (rewards, next) => {
  rewards = rewards.concat([
    {
      rid: 'invite/give-invitations',
      name: 'Give Invitations',
      inputs: [
        {
          type: 'text',
          name: 'numInvitations',
          label: 'Invitations:'
        }
      ]
    }
  ])

  next(null, rewards)
}

exports.giveInvitations = (data) => {
  const { uid, reward } = data

  if (!uid || !reward.numInvitations || !(parseInt(reward.numInvitations, 10) > 0)) {
    log('Error giving reward giveInvitations')
    return console.dir(data)
  }

  backend.incInvitesMax(uid, parseInt(reward.numInvitations, 10))
}
