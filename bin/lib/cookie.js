module.exports = {
	userCookieOptions: {
		sameSite: 'strict',
		path: '/',
		secure: !!process.env.HTTPS,
		maxAge: 30 * 60 * 1000  // 30-min sessions
	},
	consoleCookieOptions: {
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		secure: !!process.env.HTTPS,
		maxAge: 12 * 60 * 60 * 1000,  // 12-hour sessions
	}
};