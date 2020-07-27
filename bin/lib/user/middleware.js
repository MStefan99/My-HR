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
	const ip = req.ip;

	switch (libAuth.checkAuthStatus(req.session, ip)) {
		case 'NO_SESSION':
			res.flash({
				type: 'error',
				title: 'Not registered',
				info: 'You need to have a verified email address to continue to the page requested. ' +
					'Please sign up with your email first. We apologize for the inconvenience.'
			}).redirect(303, '/');
			break;
		case 'WRONG_IP':
			res.flash({
				type: 'error',
				title: 'Wrong address',
				info: 'To ensure our data stays safe we\'ve limited who can access this page. ' +
					'As a result, you can only view it from the same address as when you had while ' +
					'getting your link on the home page. Open the link from that address or create a new link by ' +
					'returning to the home page. We apologize for the inconvenience.'
			}).redirect(303, '/');
			break;
		case 'OK':
			next();
			break;
	}
}


function redirectIfExpired(req, res, next) {
	switch (libAuth.checkExpirationStatus(req.session, userCookieOptions.maxAge)) {
		case 'EXPIRED':
			res.flash({
				type: 'error',
				title: 'Link expired',
				info: 'Your link has now expired, meaning you need to return to the home page ' +
					'and get the new link to continue using the website. We apologize for the inconvenience.'
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
	getSession: getSession,
	redirectIfExpired: redirectIfExpired,
	redirectIfNotAuthorized: redirectIfNotAuthorized,
	redirectIfApplicationPeriodEnded: redirectIfApplicationPeriodEnded
};
