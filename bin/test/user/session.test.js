const libSession = require('../../lib/user/session');


test('Get session with wrong id', async () => {
	expect(await libSession.getSession(-1)).toBeUndefined();
});


test('Deny user with no session', () => {
	expect(libSession.checkAuthStatus(null, null)).toBe('NO_SESSION');
});


test('Deny user with wrong IP', () => {
	expect(libSession.checkAuthStatus({ip: '::1'}, '::2')).toBe('WRONG_IP');
});


test('Allow user with session', () => {
	expect(libSession.checkAuthStatus({ip: '::1'}, '::1')).toBe('OK');
});


test('Deny expired session', () => {
	expect(libSession.checkExpirationStatus({createdAt: Date.now() - 600 * 60 * 1000}, 30 * 60 * 1000))
		.toBe('EXPIRED');
});


test('Allow active session', () => {
	expect(libSession.checkExpirationStatus({createdAt: Date.now() - 10 * 60 * 1000}, 30 * 60 * 1000))
		.toBe('OK');
});
