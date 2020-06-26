const libUser = require('../../lib/console/user');
const libSession = require('../../lib/console/session');

const testLibUser = require('../testLib/console/user');


describe('With test user and session', () => {
	let session1, session2, user;

	const ua1 = 'ua1';
	const ua2 = 'ua2';
	const ip1 = '::1';
	const ip2 = '::2';
	const sessionData1 = {
		ua: ua1,
		ip: ip1
	};
	const sessionData2 = {
		ua: ua2,
		ip: ip2
	};

	beforeAll(async () => {
		await testLibUser.deleteUserWithUsername('test');

		user = await libUser.createUser('test');

		session1 = await libSession.createSession(user, ua1, ip1);
		session2 = await libSession.createSession(user, ua2, ip2);
	});


	afterAll(async () => {
		await session1.delete();
		await session2.delete();
	});


	test('Check created objects', async () => {
		expect(session1).toMatchObject(sessionData1);
		expect(session2).toMatchObject(sessionData2);

		[session1, session2].forEach((session) => {
			expect(session.userID).toEqual(user.id);
			expect(session.id).toBeDefined();
			expect(session.uuid).toBeDefined();
			expect(session.time).toBeDefined();
		});
	});


	test('Get created sessions', async () => {
		const sessions = await user.getSessions();
		expect(sessions).toContainEqual(session1);
		expect(sessions).toContainEqual(session2);
	});


	test('Delete session', async () => {
		await session1.delete();

		const sessions = await user.getSessions();
		expect(sessions).not.toContainEqual(session1);
	});


	test('Delete all sessions', async () => {
		await user.deleteAllSessions();

		const sessions = await user.getSessions();
		expect(sessions).toHaveLength(0);
	});
});
