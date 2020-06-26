const libSession = require('../../lib/user/session');
const libAuth = require('../../lib/user/auth');

const testLibSession = require('../testLib/user/session');


describe('With test session', () => {
	let session;

	const username = 'testUA';
	const ip = '::1';


	beforeAll(async () => {
		session = await libSession.createSession(username, ip);
	});


	afterAll(async () => {
		await testLibSession.deleteSession(session);
	});


	test('Deny user with no session', () => {
		expect(libAuth.checkAuthStatus(null, null)).toBe('NO_SESSION');
	});


	test('Deny user with wrong IP', () => {
		expect(libAuth.checkAuthStatus(session, '::2')).toBe('WRONG_IP');
	});


	test('Allow user with session', () => {
		expect(libAuth.checkAuthStatus(session, '::1')).toBe('OK');
	});


	test('Deny expired session', () => {
		const sessionCopy = Object.assign({}, session);
		sessionCopy.createdAt = Date.now() - 60 * 60 * 1000;  // 1 hour
		expect(libAuth.checkExpirationStatus(sessionCopy, 30 * 60 * 1000))  // 30 minutes
			.toBe('EXPIRED');
	});


	test('Allow active session', () => {
		const sessionCopy = Object.assign({}, session);
		sessionCopy.createdAt = Date.now() - 10 * 60 * 1000;  // 10 minutes
		expect(libAuth.checkExpirationStatus(sessionCopy, 30 * 60 * 1000))  // 30 minutes
			.toBe('OK');
	});
});

