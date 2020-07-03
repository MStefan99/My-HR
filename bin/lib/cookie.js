module.exports = {
	userCookieOptions: {
		httpOnly: true,
		sameSite: 'strict',
		maxAge: 30 * 60 * 1000  // 30-min sessions
	},
	consoleCookieOptions: {
		httpOnly: true,
		sameSite: 'strict',
		maxAge: 12 * 60 * 60 * 1000  // 12-hour sessions
	}
};