const twoFactor = require('node-2fa');

const lib2FA = require('../../lib/console/2fa');
const libUser = require('../../lib/console/user');

const testLibUser = require('../testLib/console/user');


describe('With test user', () => {
	let user;
	const username = 'test2FA';


	beforeAll(async () => {
		await testLibUser.deleteUserWithUsername(username);

		user = await libUser.createUser(username);
	});


	afterAll(async () => {
		await user.delete();
	});


	test('Generate secret with null user', () => {
		const secret = lib2FA.generateSecret(null);

		expect(secret).toBeDefined();
		expect(secret.uri)
			.toMatch(encodeURIComponent('My HR:My HR'));
		expect(secret.qr)
			.toMatch(encodeURIComponent('My HR:My HR'));
	});


	test('Generate secret with no user', () => {
		const secret = lib2FA.generateSecret('NO_USER');

		expect(secret).toBeDefined();
		expect(secret.uri)
			.toMatch(encodeURIComponent('My HR:My HR'));
		expect(secret.qr)
			.toMatch(encodeURIComponent('My HR:My HR'));
	});


	test('Generate secret', () => {
		const secret = lib2FA.generateSecret(user);

		expect(secret).toBeDefined();
		expect(secret.uri)
			.toMatch(encodeURIComponent('My HR:' + username));
		expect(secret.qr)
			.toMatch(encodeURIComponent('My HR:' + username));
	});


	test('Verify secret', async () => {
		const secret = lib2FA.generateSecret(user);
		await user.setSecret(secret.secret);

		expect(lib2FA.verifyOtp(user,
			twoFactor.generateToken(user.secret).token))
			.toBeTruthy();
	});


	test('Verify invalid secret', async () => {
		expect(lib2FA.verifyOtp(user, null))
			.toBeFalsy();
		expect(lib2FA.verifyOtp(user, '00000'))
			.toBeFalsy();
		expect(lib2FA.verifyOtp(null, null))
			.toBeFalsy();
	});
});