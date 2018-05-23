// TODO: Remove

var nodebb = require('./nodebb')
var settings = require('./settings')
const { log } = require('./utils')

const { async } = nodebb

module.exports = {
	getInvitesPending      : getInvitesPending,
	getInvitesAccepted     : getInvitesAccepted,

	getInvitesMax          : getInvitesMax,
	setInvitesMax          : setInvitesMax,
	incInvitesMax          : incInvitesMax,
	dcrInvitesMax          : dcrInvitesMax,

	setInvites : setInvites,

	getUidFromInvitedEmail : getUidFromInvitedEmail,
	isEmailInvited         : isEmailInvited,

	acceptInvitation       : acceptInvitation,
	userDelete             : userDelete,
	referral               : referral
}

function getInvitesPending(uid, next)
{
	nodebb.db.getSortedSetRangeByScore('invitation:uid', 0, 10000, uid, uid, next);
}

function getInvitesAccepted(uid, next)
{
	nodebb.db.getSortedSetRangeByScore('user:invitedby', 0, 10000, uid, uid, function (err, uids) {
		nodebb.User.getUsersData(uids, next);
	});
}

function getInvitesMax(uid, next)
{
	nodebb.db.getObjectField('user:' + uid, 'invitesmax', function (err, invitesmax){
		if (!invitesmax) {
			invitesmax = settings.get('defaultInvitations');
			nodebb.db.setObjectField('user:' + uid, 'invitesmax', invitesmax);
		}
		invitesmax = parseInt(invitesmax, 10);
		next(err, invitesmax);
	});
}

function setInvitesMax(uid, amount, next)
{
	nodebb.db.setObjectField('user:' + uid, 'invitesmax', amount, next);
}

function incInvitesMax(uid, amount, next)
{
	nodebb.db.getObjectField('user:' + uid, 'invitesmax', function (err, invitesmax){
		if (!invitesmax) invitesmax = settings.get('defaultInvitations');
		nodebb.db.setObjectField('user:' + uid, 'invitesmax', parseInt(invitesmax, 10) + parseInt(amount, 10), next);
	});
}

function dcrInvitesMax(uid, amount, next)
{
	nodebb.db.getObjectField('user:' + uid, 'invitesmax', function (err, invitesmax){
		if (!invitesmax) invitesmax = settings.get('defaultInvitations');
		nodebb.db.setObjectField('user:' + uid, 'invitesmax', invitesmax - amount, next);
	});
}

function setInvites(uid, amount, next)
{
	nodebb.db.setObjectField('user:' + uid, 'invitesmax', amount);
}

function getUidFromInvitedEmail(email, next)
{
	email = email.toLowerCase();
  log("Getting getUidFromInvitedEmail of " + email);
	nodebb.db.sortedSetScore('invitation:uid', email, next);
}

function isEmailInvited(email, next)
{
	email = email.toLowerCase();
	nodebb.db.isSortedSetMember('invitation:uid', email, next);
}

function acceptInvitation(userData, next)
{
	nodebb.db.sortedSetScore('invitation:uid', userData.email.toLowerCase(), function (err, uid) {
		if (err || !uid) return;
		nodebb.db.sortedSetAdd('user:invitedby', uid, userData.uid, function (){
			nodebb.db.getSortedSetRangeByScore('user:invitedby', 0, 10000, uid, uid, function (err, uids) {
				if (err || !uids) return next(err);
				next(null, uids.length);
			});
		});
		nodebb.db.sortedSetRemove('invitation:uid', userData.email.toLowerCase());
	});
}

// Hook: static:user.delete
function userDelete(data, next)
{
	nodebb.db.sortedSetRemove('user:invitedby', data.uid, next);
}

function referral(data, next)
{
	var key = "invitation:reflinks";
	switch(data.action || null) {
		case 'insert':
			nodebb.db.setAdd(key, data.value, next);
			break;
		case 'delete':
			nodebb.db.setRemove(key, data.value, next);
			break;
		case 'isMember':
			nodebb.db.isSetMember(key, data.value, next);
			break;
		default:
			nodebb.db.getSetMembers(key, next);
	}
}
