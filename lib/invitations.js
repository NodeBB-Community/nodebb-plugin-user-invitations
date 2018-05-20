// Invitations

const backend  = require('./backend')
const emailer  = require('./emailer')
const logger   = require('./logger')
const nodebb   = require('./nodebb')
const settings = require('./settings')

const { async, nconf } = nodebb

exports.userDelete = backend.userDelete

// Send invitation email.
exports.sendInvitation = (params, group) => {
  var email        = params.email.toLowerCase(),
    fromUser     = params.from,
    registerLink = nconf.get('url') + '/register',
    site_title   = nodebb.meta.config.title || nodebb.meta.config.browserTitle || 'NodeBB',
    subject      = '[[email:invite, ' + site_title + ']]';

  async.waterfall([
    function(next) {
      if (fromUser) {
        backend.createInvitation(fromUser, email);
        nodebb.user.getUserField(fromUser, 'username', next);
      }else{
        nodebb.translator.translate("[[invite:an-admin]]", function(username) {
          next(null, username);
        });
      }
    },
    function(username, next) {

      var emailData = {
        site_title: site_title,
        registerLink: registerLink,
        subject: subject,
        username: username
      };

      nodebb.emailer.sendToEmail('invitation', email, nodebb.meta.config.defaultLang, emailData, next);

    }
  ], function (err) {
    if (err) logger.log(err);
  });
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
    isInvitedByAdmin : async.apply(settings.isInvitedByAdmin, email),
    isInvitedByUser  : async.apply(backend.isEmailInvited, email),
  }, (err, results) => {
    next(err, results.isInvitedByAdmin || results.isInvitedByUser)
  })
}

function getInvitedInfo(email, next)
{
  email = email.toLowerCase();
  async.parallel({
    isInvitedByAdmin : async.apply(settings.isInvitedByAdmin, email),
    isInvitedByUid   : async.apply(backend.getUidFromInvitedEmail, email)
  }, next);
}

// Hook: action.user.loggedIn
exports.loginCheck = (data) => {
  const uid = data.uid;
  const req = data.req;
  const ref = req.cookies.ref;

  async.waterfall([
    (next) => {
        backend.referral({action: 'isMember', value: uid}, next);
    },
    (isMember, next) => {
    if(isMember)
      return next(new Error("Member has already been referred"));
        nodebb.user.getUserData(uid, next);
    },
    (userInfo, next) => {
        if (userInfo.joindate < +new Date() - 1000 * 60)
            return next(new Error("Hijack attempt blocked"));
        next();
    },
    (next) => {
        backend.referral({action: 'insert', value: uid}, next);
    },
    (next) => {
        nodebb.user.getUserField(uid, 'email', next);
    },
    (email, next) => {
        nodebb.user.getUidByUsername(ref, (e, uid) => {
            {
                next(e, {
                    referral: email,
                    referring: uid
                });
            }
        });
    },
    (data, next) => {
        //allows for unlimited invites via link
        backend.incInvitesMax(data.referring, 1, (error, d) => {
            next(error, data);
        });
    },
    (data, next) => {
        if (data.referring === uid)
            return next(new Error("Cannot refer self"));
        backend.createInvitation(data.referring, data.referral, (e, d) => {
            next(e, data.referral);
        });
    },
  ], (error, email) => {
    if (error)
        return logger.log(error);
    userCreate({
        email: email,
        uid: uid
    });
  });
}

// Hook: action:user.create
exports.userCreate = (userData) => {
  logger.log("Created account for " + userData.email + ", checking invites...");

  var inviteGroup = settings.get('inviteGroup');

  // TODO: add sso invites.
  if (!userData.email) return logger.log('Skipping userCreate of ' + JSON.stringify(userData));

  userData.email = userData.email.toLowerCase();

  getInvitedInfo(userData.email, function (err, info) {

    logger.log("Results: " + JSON.stringify(info));

    // Return if not invited.
    if (err || !(info.isInvitedByUid || info.isInvitedByAdmin)) return logger.log("User wasn't invited.");

    // Join the invited group.
    nodebb.groups.join(inviteGroup, userData.uid);

    if (info.isInvitedByUid) {
      backend.acceptInvitation(userData, function (err, acceptedInvites) {
        nodebb.rewards.checkConditionAndRewardUser(info.isInvitedByUid, 'invite/accepted-invitations', function(callback) {
          callback(null, acceptedInvites);
        });
      });
    }

    if (info.isInvitedByAdmin) {
      var invitedUsers = settings.get('invitedUsers');

      if (invitedUsers) {
        async.filter(invitedUsers, function (_email, next) {
          next(_email.toLowerCase() !== userData.email.toLowerCase());
        }, function (_invitedUsers) {
          settings.set('invitedUsers', _invitedUsers);
          settings.persist();
        });
      }
    }
  });
}

// Hook: filter:register.check
exports.registerCheck = (data, next) => {
  // We skip invitation checks if no email was provided.
  if (!settings.get('restrictRegistration') || !data.userData.email) return next(null, data);

  var email = data.userData.email.toLowerCase();

  isInvited(email, function (err, invited) {
    if (err || !invited) return next(new Error('[[invite:not-invited]] ' + email));
    next(null, data);
  });
}
