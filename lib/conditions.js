// nodebb-plugin-user-invitations
// Rewards Conditions

exports.get = (conditions, next) => {
  conditions.push({ name: 'Accepted Invitations', condition: 'invite/accepted-invitations' })

  next(null, conditions)
}
