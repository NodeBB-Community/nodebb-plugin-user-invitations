// Socket Plugins

const Rewards = require('./rewards')
const backend = require('./backend')
const { getUserInvitations, isInvited, sendInvitation } = require('./invitations')
const { async, db, user } = require('./nodebb')

exports.send = ({uid}, {emails}, next) => {
  // Guests can't send invites.
  if (!uid) return

  // Assert parameters.
  if (!emails || !emails.length) return next(new Error('[[fail_no_emails]]'))

  // Sort emails and convert to lowercase.
  filterEmails(emails, function (err, payload) {

    // Check that the user has enough available invites to send the new invitations.
    getUserInvitations(uid, function (err, invites) {

      if (err) return next(new Error('[[fail_db]]'));

      backend.getInvitesMax(uid, function (err, invitesMax) {

        if (err) return next(new Error('[[fail_db]]'));

        if (invitesMax - invites.invitesPending.length - invites.invitesAccepted.length < payload.available.length) return next(new Error('[[not_enough_invites]]'));

        payload.available.forEach(function(email){
          sendInvitation({email: email, from: uid});
        });

        // Send the results back to the client.
        next(null, payload);
      });
    });
  });
}

exports.reinvite = (socket, data, next) => {
  if (!socket.uid) return;
  if (!(data && data.email)) return next(new Error("No email to reinvite."));

  var email = data.email.toLowerCase();

  db.sortedSetScore('invitation:uid', email, function (err, uid) {
    if (err || !uid) return next(err || new Error("Database error reinviting " + email));
    if (parseInt(uid, 10) !== socket.uid) return next(new Error("User not invited by you."));

    db.getObjectField('user:' + socket.uid, 'user-reinvite-cooldown', function (err, cooldown) {
      if (err) return next(new Error("Database error reinviting " + email));

      if (!cooldown || cooldown < Date.now()) {
        sendInvitation({email: email, from: socket.uid});
        db.setObjectField('user:' + socket.uid, 'user-reinvite-cooldown', Date.now() + 300000);
        next(null, {available: [email]});
      }else{
        next(new Error("You must wait 5 minutes before resending an invite."));
      }
    });
  });
}

exports.uninvite = (socket, data, next) => {
  if (!socket.uid) return;
  if (!(data && data.email)) return next(new Error("No email to uninvite."));

  var email = data.email.toLowerCase();

  db.sortedSetScore('invitation:uid', email, function (err, uid) {
    if (err || !uid) return next(err || new Error("Database error uninviting " + email));
    if (parseInt(uid, 10) !== socket.uid) return next(new Error("User not invited by you."));

    db.sortedSetRemove('invitation:uid', email, next);
  });
}

exports.giveReward = (socket, data, next) => Rewards.giveInvitations(data)

exports.setInvites = (socket, {uid, invites}, next) => backend.setInvites(uid, invites)

function filterEmails (emails, next) {
  var payload = {available:[],unavailable:[],error:[]};

  // Make lowercase.
  emails = emails.map(email => email.toLowerCase())

  // Remove duplicates.
  emails = emails.sort().filter((item, pos, ary) => !pos || item != ary[pos - 1])

  // Check availability and if they were already invited.
  async.each(emails, (email, next) => {
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

      return next()
    })
  }, function(){
    next(null, payload)
  })
}
