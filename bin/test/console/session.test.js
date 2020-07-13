'use strict';

const libUser = require('../../lib/console/user');
const libSession = require('../../lib/console/session');

const testLibUser = require('../testLib/console/user');


describe('With test session and user', () => {
	let session1, session2, user;

	const username = 'testCS';
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
		await testLibUser.deleteUserWithUsername(username);

		user = await libUser.createUser(username);
		session1 = await libSession.createSession(user, ua1, ip1);
		session2 = await libSession.createSession(user, ua2, ip2);
	});


	afterAll(async () => {
		await user.delete();

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
		const sessions = await libSession.getUserSessions(user);
		expect(sessions).toContainEqual(session1);
		expect(sessions).toContainEqual(session2);
	});


	test('Get session by id', async () => {
		expect(await libSession.getSessionByID(session1.id))
			.toEqual(session1);
		expect(await libSession.getSessionByID(session2.id))
			.toEqual(session2);
	});


	test('Get session by uuid', async () => {
		expect(await libSession.getSessionByUUID(session1.uuid))
			.toEqual(session1);
		expect(await libSession.getSessionByUUID(session2.uuid))
			.toEqual(session2);
	});


	test('Get invalid sessions', async () => {
		expect(await libSession.getSessionByUUID(-1))
			.toBe('NO_SESSION');
		expect(await libSession.getSessionByID(-1))
			.toBe('NO_SESSION');
	});


	test('Delete session', async () => {
		expect(await session1.delete()).toBe('OK');

		const sessions = await libSession.getUserSessions(user);
		expect(sessions).not.toContainEqual(session1);
	});


	test('Delete all sessions', async () => {
		expect(await libSession.deleteAllUserSessions(user))
			.toBe('OK');

		const sessions = await libSession.getUserSessions(user);
		expect(sessions).toHaveLength(0);
	});
});
