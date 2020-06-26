const libSession = require('../../lib/console/session');
const libUser = require('../../lib/console/user');
const libAuth = require('../../lib/console/auth');

const testLibUser = require('../testLib/console/user');


describe('With test session and user', () => {
	let session,
		adminSession,
		user,
		admin;

	const ua1 = 'ua1';
	const ip1 = '::1';
	const ua2 = 'ua2';
	const ip2 = '::2';
	const age = 1000 * 60 * 60 * 12;
	const username = 'testCA';
	const adminUsername = 'testAdminCA';


	beforeAll(async () => {
		await testLibUser.deleteUserWithUsername(username);
		await testLibUser.deleteUserWithUsername(adminUsername);

		user = await libUser.createUser(username);
		admin = await libUser.createUser(adminUsername, 1);

		session = await libSession.createSession(user, ua1, ip1);
		adminSession = await libSession.createSession(admin, ua2, ip2);
	});


	afterAll(async () => {
		adminSession.delete();
		session.delete();

		admin.delete();
		user.delete();
	});


	test('Not logged in', () => {
		expect(libAuth.checkAuthStatus(null, null))
			.toBe('NO_SESSION');
	});


	test('Wrong user agent', () => {
		expect(libAuth.checkAuthStatus(session,
			user,
			ua2,
			ip1,
			age)).toBe('WRONG_UA');
	});


	test('Wrong IP', () => {
		expect(libAuth.checkAuthStatus(session,
			user,
			ua1,
			ip2,
			age)).toBe('WRONG_IP');
	});


	test('Expired session', () => {
		const sessionCopy = Object.assign({}, session);
		sessionCopy.time = Date.now() - 1000 * 60 * 60 * 24;

		expect(libAuth.checkAuthStatus(sessionCopy,
			user,
			ua1,
			ip1,
			age)).toBe('EXPIRED');
	});


	test('Session belongs to different user', () => {
		expect(libAuth.checkAuthStatus(adminSession,
			user,
			ua2,
			ip2,
			age)).toBe('ID_MISMATCH');
	});


	test('Password not set up', () => {
		expect(libAuth.checkAuthStatus(session,
			user,
			ua1,
			ip1,
			age)).toBe('NO_PASSWORD');
	});


	test('2FA not set up', () => {
		const userCopy = Object.assign({} ,user);
		userCopy.passwordHash = 'hash';

		expect(libAuth.checkAuthStatus(session,
			userCopy,
			ua1,
			ip1,
			age)).toBe('NO_2FA');
	});


	test('User registered', () => {
		const userCopy = Object.assign({} ,user);
		userCopy.passwordHash = 'hash';
		userCopy.secret = 'secret';

		expect(libAuth.checkAuthStatus(session,
			userCopy,
			ua1,
			ip1,
			age)).toBe('OK');
	});


	test('Check user rights', () => {
		expect(libAuth.getPrivileges(user)).toBe('USER');
	});


	test('Check admin rights', () => {
		expect(libAuth.getPrivileges(admin)).toBe('ADMIN');
	});
});
