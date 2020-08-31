module.exports = {
	userCookieOptions: {
		sameSite: 'strict',
		path: '/',
		secure: !!process.env.HTTPS,
		maxAge: 2 * 60 * 60 * 1000  // 2-hour sessions
	},
	consoleCookieOptions: {
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		secure: !!process.env.HTTPS,
		maxAge: 12 * 60 * 60 * 1000,  // 12-hour sessions
	}
};
