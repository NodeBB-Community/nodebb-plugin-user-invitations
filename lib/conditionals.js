// nodebb-plugin-user-invitations
// Rewards Conditionals

const { db } = require('./nodebb')

exports.get = (conditionals, next) => {
  db.getSortedSetRange('plugins:active', 0, -1, (err, activePlugins) => {
    // Add essential conditionals.
    if (Array.isArray(activePlugins) && activePlugins.indexOf('nodebb-rewards-essentials') === -1) {
      conditionals = conditionals.concat([
        { name: '>', conditional: 'greaterthan' },
        { name: '>=', conditional: 'greaterorequalthan' },
        { name: '<', conditional: 'lesserthan' },
        { name: '<=', conditional: 'lesserorequalthan' },
        { name: 'string:', conditional: 'string' },
      ])
    }

    next(null, conditionals)
  })
}

// Default conditionals.
exports.greaterthan        = ({left, right}, next) => next(null, parseInt(left) >  parseInt(right))
exports.greaterorequalthan = ({left, right}, next) => next(null, parseInt(left) >= parseInt(right))
exports.lesserthan         = ({left, right}, next) => next(null, parseInt(left) <  parseInt(right))
exports.lesserorequalthan  = ({left, right}, next) => next(null, parseInt(left) <= parseInt(right))
exports.string             = ({left, right}, next) => next(null, left === right)
