// Socket Admin

const { isInvited, sendInvitation } = require('./invitations')

const { async, user } = require('./nodebb')

exports.send = (socket, data, next) => {
  if (!data || !data.emails || !Array.isArray(data.emails)) return next(new Error('[[fail_bad_data]]'));

  filterEmails(data.emails, function (err, payload) {
    payload.available.forEach(function(email){
      sendInvitation({email: email.toLowerCase()});
    });

    next(null, payload);
  });
}

exports.reinvite = (socket, data, next) => {
  if (!(data && data.email)) return next(new Error("No email to reinvite."));

  var email = data.email.toLowerCase();

  sendInvitation({email: email});

  next(null, {available: [email]});
}

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
