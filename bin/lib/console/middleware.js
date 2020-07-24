'use strict';

const libSession = require('./session');
const libUser = require('./user');
const libAuth = require('./auth');

const {consoleCookieOptions} = require('../cookie');


async function getSession(req, res, next) {
	if (req.cookies.CSID) {
		req.session = await libSession.getSessionByUUID(req.cookies.CSID);
	}
	next();
}


async function getUser(req, res, next) {
	if (req.session && req.session !== 'NO_SESSION') {
		req.user = await libUser.getUserByID(req.session.userID);
		res.locals.user = req.user;
	} else if (req.cookies.CUID) {
		req.user = await libUser.getUserByUUID(req.cookies.CUID);
	}
	next();
}


async function redirectIfNotAuthorized(req, res, next) {
	switch (libAuth.checkAuthStatus(req.session,
		req.user,
		req.get('user-agent'),
		req.ip,
		consoleCookieOptions.maxAge)) {
		case 'NO_SESSION':
			res.clearCookie('CSID', consoleCookieOptions);
			res.flash({
				type: 'warning',
				title: 'Not signed in',
				info: 'You need to sign in to view this page.'
			});
			res.redirect(303, '/console/login/');
			break;
		case 'WRONG_UA':
		case 'WRONG_IP':
		case 'EXPIRED':
		case 'ID_MISMATCH':
			await req.session.delete();

			res.clearCookie('CSID', consoleCookieOptions);
			res.flash({
				type: 'warning',
				title: 'Signed out',
				info: 'You have been signed out, please sign in again.'
			});
			res.redirect(303, '/console/login/');
			break;
		case 'NO_PASSWORD' :
			res.flash({
				title: 'Sign up for My HR',
				info: 'To use My HR, please create your password here'
			});
			res.redirect(303, '/console/register/');
			break;
		case 'NO_2FA':
			res.flash({
				title: 'Set up 2FA',
				info: 'Set up 2FA to start using My HR'
			});
			res.redirect(303, '/console/setup-otp/');
			break;
		case 'OK':
			next();
			break;
	}
}


async function redirectIfNotAdmin(req, res, next) {
	switch (libAuth.getPrivileges(req.user)) {
		case 'USER':
			res.flash({
				type: 'error',
				title: 'Not allowed',
				info: 'You do not have enough permissions ' +
					'to view the page requested'
			});
			res.redirect(303, '/console/');
			break;
		case 'ADMIN':
			next();
			break;
	}
}


module.exports = {
	getSession: getSession,
	getUser: getUser,
	redirectIfNotAuthorized: redirectIfNotAuthorized,
	redirectIfNotAdmin: redirectIfNotAdmin
};
