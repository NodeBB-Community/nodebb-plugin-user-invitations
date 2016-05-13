"use strict"

var nodebb = require('./nodebb');
var logger = require('./logger');
var settings = require('./settings');

var async  = require('async');

module.exports = {
	getInvitesPending      : getInvitesPending,
	getInvitesAccepted     : getInvitesAccepted,

	getInvitesMax          : getInvitesMax,
	setInvitesMax          : setInvitesMax,
	incInvitesMax          : incInvitesMax,
	dcrInvitesMax          : dcrInvitesMax,

	setInvites : setInvites,

	createInvitation       : createInvitation,
	getUidFromInvitedEmail : getUidFromInvitedEmail,
	isEmailInvited         : isEmailInvited,

	acceptInvitation       : acceptInvitation,
	userDelete             : userDelete
}

function getInvitesPending(uid, next)
{
	nodebb.db.getSortedSetRangeByScore('invitation:uid', 0, 10000, uid, uid, next);
}

function getInvitesAccepted(uid, next)
{
	nodebb.db.getSortedSetRangeByScore('user:invitedby', 0, 10000, uid, uid, function (err, uids) {
		nodebb.user.getUsersData(uids, next);
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
	nodebb.db.setObjectField('user:' + uid, 'invitesmax', amount, function (err, invitesmax){
		console.log("setInvites done: " + invitesmax);
	});
}

function createInvitation(from, email, next)
{
	email = email.toLowerCase();
	nodebb.db.sortedSetAdd('invitation:uid', from, email, next);
}

function getUidFromInvitedEmail(email, next)
{
	logger.log("Getting getUidFromInvitedEmail of " + email);
	email = email.toLowerCase();
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
