const libSession = require('./session');
const libUser = require('./user');
const libAuth = require('./auth');


async function getSession(req, res, next) {
	if (req.cookies.CSID) {
		req.session = libSession.getSessionByUUID(req.cookies.CSID);
	}
	next();
}


async function getUser(req, res, next) {
	if (req.session) {
		req.user = libUser.getUserByID(req.session.userID);
	} else if (req.cookies.CUID) {
		req.user = libUser.getUserByUUID(req.cookies.CUID);
	}
	next();
}


async function redirectIfNotAuthorized(req, res, next) {
	switch (libAuth.checkAuthStatus()) {
		case 'NO_SESSION':
			res.redirect(303, '/console/login/');
			break;
		case 'UA_CHANGED':
		case 'WRONG_IP':
		case 'EXPIRED':
			res.redirect('/console/logout/');
			break;
		case 'NO_PASSWORD' :
			res.redirect(303, '/console/register/');
			break;
		case 'NO_2FA':
			res.redirect(303, '/console/setup-otp/');
			break;
		case 'OK':
			next();
			break;
	}
}


async function redirectIfNotAdmin(req, res, next) {

	switch (libAuth.checkAdminStatus()) {
		case 'NOT_ADMIN':
			res.redirect(303, '/console/');
			break;
		case 'OK':
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
