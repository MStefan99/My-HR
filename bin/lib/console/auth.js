function checkAuthStatus(session, user, userAgent, ip, age) {
	if (!session) {
		return 'NO_SESSION';
	} else if (session.ua !== userAgent) {
		return 'UA_CHANGED';
	} else if (session.ip !== ip) {
		return 'WRONG_IP';
	} else if (Date.now() - session.time > age) {
		return 'EXPIRED';
	} else if (!user.passwordHash) {
		return 'NO_PASSWORD';
	} else if (!req.user.secret) {
		return 'NO_2FA';
	} else {
		return 'OK';
	}
}


function checkAdminStatus(user) {
	if (!user.admin) {
		return 'NOT_ADMIN';
	} else {
		return 'OK';
	}
}


module.exports = {
	checkAuthStatus: checkAuthStatus,
	checkAdminStatus: checkAdminStatus
};
