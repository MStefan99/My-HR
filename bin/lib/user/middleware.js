'use strict';

const libSession = require('./session');
const libAuth = require('./auth');

const {userCookieOptions} = require('../cookie');

const applicationPeriodEnd = 1603054800000;


async function getSession(req, res, next) {
	const uuid = req.query.sessionID || req.cookies.SID;
	req.session = await libSession.getSessionByUUID(uuid);

	if (req.query.sessionID && req.session !== 'NO_SESSION') {
		const options = {...userCookieOptions};
		options.expires = new Date(req.session.createdAt + userCookieOptions.maxAge);
		delete options.maxAge;

		res.cookie('SID', req.query.sessionID, options);
	}
	next();
}


function redirectIfNotAuthorized(req, res, next) {
	switch (libAuth.checkAuthStatus(req.session, req.ip)) {
		case 'NO_SESSION':
			res.flash({
				type: 'warning',
				title: 'Not registered',
				info: 'You need to have a verified email address to continue. ' +
					'Please sign up on the home page first.'
			}).redirect(303, '/');
			break;
		case 'WRONG_IP':
		case 'OK':
			next();
			break;
	}
}


function redirectIfExpired(req, res, next) {
	switch (libAuth.checkExpirationStatus(req.session, userCookieOptions.maxAge)) {
		case 'EXPIRED':
			res.flash({
				type: 'warning',
				title: 'Link expired',
				info: 'Your link has expired, meaning you need to ' +
					'get the new link on the home page to continue using the website.'
			}).redirect(303, '/');
			break;
		case 'OK':
			next();
			break;
	}
}


function redirectIfApplicationPeriodEnded(req, res, next) {
	if (Date.now() > applicationPeriodEnd) {
		res.flash({
			type: 'error',
			title: 'Application period is over',
			info: 'Unfortunately, application period is over. ' +
				'Thank you for your interest in Mine Eclipse!'
		}).redirect(303, '/');
	} else {
		next();
	}
}


module.exports = {
	getSession: () => getSession,
	redirectIfExpired: () => redirectIfExpired,
	redirectIfNotAuthorized: () => redirectIfNotAuthorized,
	redirectIfApplicationPeriodEnded: () => redirectIfApplicationPeriodEnded
};
