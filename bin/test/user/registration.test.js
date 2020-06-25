const libSession = require('../../lib/user/session');

const testLibSession = require('../testLib/user/session');


describe('With test session', () => {
	let createdSession;

	const username = 'user1';
	const email = username + '@metropolia.fi';
	const ip = '::1';
	const session = {email: email, ip: ip};


	beforeAll(async () => {
		createdSession = await libSession.createSession(username, ip);
	});


	afterAll(async () => {
		await testLibSession.deleteSession(session.id).catch(() => {});
	});


	test('Check created session', async () => {
		expect(createdSession).toMatchObject(session);
	});
});

