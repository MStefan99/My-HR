'use strict';

const libSession = require('./session');
const libAuth = require('./auth');

const {userCookieOptions} = require('../cookie');



async function getSession(req, res, next) {
	const uuid = req.query.sessionID || req.cookies.SID;

	if (req.query.sessionID) {
		res.cookie('SID', req.query.sessionID, userCookieOptions);
	}
	req.session = await libSession.getSessionByUUID(uuid);
	next();
}


function redirectIfNotAuthorized(req, res, next) {
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	switch (libAuth.checkAuthStatus(req.session, ip)) {
		case 'NO_SESSION':
			res.render('user/status', {
				title: 'Not registered',
				info: 'To ensure our data stays safe we\'ve limited who can access this page. To continue, please ' +
					'return to the home page and get a link by filling in a form. We apologize for the inconvenience.'
			});
			break;
		case 'WRONG_IP':
			res.render('user/status', {
				title: 'Wrong address',
				info: 'To ensure our data stays safe we\'ve limited who can access this page. ' +
					'As a result, you can only view it from the same address as when you had while ' +
					'getting your link on the home page. Open the link from that address or create a new link by ' +
					'returning to the home page. We apologize for the inconvenience.'
			});
			break;
		case 'OK':
			next();
			break;
	}
}


function redirectIfExpired(req, res, next) {
	switch (libAuth.checkExpirationStatus(req.session, userCookieOptions.maxAge)) {
		case 'EXPIRED':
			res.render('user/status', {
				title: 'Link expired', info: 'To ensure our data stays safe we\'ve limited the time during which ' +
					'links are valid. Your one has now expired, meaning you need to return to the home page ' +
					'and get the new link to continue using the website. We apologize for the inconvenience.'
			});
			break;
		case 'OK':
			next();
			break;
	}
}


module.exports = {
	getSession: getSession,
	redirectIfExpired: redirectIfExpired,
	redirectIfNotAuthorized: redirectIfNotAuthorized
};
