function checkAuthStatus(session, ip) {
	if (!session || session === 'NO_SESSION') {
		return 'NO_SESSION';
	} else if (session.ip !== ip) {
		return 'WRONG_IP';
	} else {
		return 'OK';
	}
}


function checkExpirationStatus(session, age) {
	if (Date.now() - session.createdAt > age) {
		return 'EXPIRED';
	} else {
		return 'OK';
	}
}


module.exports = {
	checkAuthStatus: checkAuthStatus,
	checkExpirationStatus: checkExpirationStatus
};