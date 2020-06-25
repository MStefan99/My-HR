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
		await testLibSession.deleteSession(createdSession);
	});


	test('Check created session', async () => {
		expect(createdSession).toMatchObject(session);
	});


	test('Get invalid session', async () => {
		expect(await libSession.getSessionByID(-1)).toBe('NO_SESSION');
		expect(await libSession.getSessionByUUID(-1)).toBe('NO_SESSION');
	});


	test('Get created session', async () => {
		expect(await libSession.getSessionByID(createdSession.id))
			.toMatchObject(session);
		expect(await libSession.getSessionByUUID(createdSession.uuid))
			.toMatchObject(session);
	});
});
