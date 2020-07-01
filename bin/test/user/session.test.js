'use strict';

const libSession = require('../../lib/user/session');

const testLibSession = require('../testLib/user/session');


describe('With test session', () => {
	let session;

	const username = 'testUS';
	const email = username + '@metropolia.fi';
	const ip = '::1';
	const sessionData = {email: email, ip: ip};


	beforeAll(async () => {
		session = await libSession.createSession(username, ip);
	});


	afterAll(async () => {
		await testLibSession.deleteSession(session);
	});


	test('Check created object', async () => {
		expect(session).toMatchObject(sessionData);
		expect(session.id).toBeDefined();
		expect(session.uuid).toBeDefined();
		expect(session.createdAt).toBeDefined();
	});


	test('Get session by id', async () => {
		expect(await libSession.getSessionByID(session.id))
			.toEqual(session);
	});


	test('Get session by uuid', async () => {
		expect(await libSession.getSessionByUUID(session.uuid))
			.toEqual(session);
	});


	test('Get invalid session', async () => {
		expect(await libSession.getSessionByID(-1))
			.toBe('NO_SESSION');
		expect(await libSession.getSessionByUUID(-1))
			.toBe('NO_SESSION');
	});
});
