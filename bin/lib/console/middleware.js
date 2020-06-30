const libSession = require('./session');
const libUser = require('./user');
const libAuth = require('./auth');


const sessionLength = 1000 * 60 * 60 * 12;  // 12-hour sessions


async function getSession(req, res, next) {
	if (req.cookies.CSID) {
		req.session = await libSession.getSessionByUUID(req.cookies.CSID);
	}
	next();
}


async function getUser(req, res, next) {
	if (req.session && req.session !== 'NO_SESSION') {
		req.user = await libUser.getUserByID(req.session.userID);
	} else if (req.cookies.CUID) {
		req.user = await libUser.getUserByUUID(req.cookies.CUID);
	}
	next();
}


async function redirectIfNotAuthorized(req, res, next) {
	switch (libAuth.checkAuthStatus(req.session,
		req.user,
		req.headers['user-agent'],
		req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		sessionLength)) {
		case 'NO_SESSION':
			res.redirect(303, '/console/login/');
			break;
		case 'UA_CHANGED':
		case 'WRONG_IP':
		case 'EXPIRED':
			await req.session.delete();
			res.redirect(303, '/console/login/');
			break;
		case 'ID_MISMATCH':
			await req.user.deleteAllSessions();
			res.redirect(303, '/console/login/');
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

	switch (libAuth.getPrivileges(req.user)) {
		case 'USER':
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
