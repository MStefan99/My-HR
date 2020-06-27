function checkAuthStatus(session, user, userAgent, ip, age) {
	if (!session || session === 'NO_SESSION') {
		return 'NO_SESSION';
	} else if (session.ua !== userAgent) {
		return 'WRONG_UA';
	} else if (session.ip !== ip) {
		return 'WRONG_IP';
	} else if (Date.now() - session.time > age) {
		return 'EXPIRED';
	} else if (session.userID !== user.id) {
		return 'ID_MISMATCH'
	} else if (!user.passwordHash) {
		return 'NO_PASSWORD';
	} else if (!user.secret) {
		return 'NO_2FA';
	} else {
		return 'OK';
	}
}


function getPrivileges(user) {
	if (user.admin) {
		return 'ADMIN';
	} else {
		return 'USER';
	}
}


module.exports = {
	checkAuthStatus: checkAuthStatus,
	getPrivileges: getPrivileges
};
