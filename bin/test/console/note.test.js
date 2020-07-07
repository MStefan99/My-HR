'use strict';


const libUser = require('../../lib/console/user');
const libSession = require('../../lib/user/session');
const libNote = require('../../lib/console/note');

const testLibUser = require('../testLib/console/user');
const testLibSession = require('../testLib/user/session');
const testLibApplication = require('../testLib/application');


describe('With test user, session, application and notes', () => {
	let session,
		application1,
		application2,
		user1,
		user2,
		commonNote,
		commonSharedNote,
		applicationNote,
		applicationSharedNote;

	const applicationData1 = {
		firstName: 'Test',
		lastName: 'User',
		backupEmail: 'test1@example.com',
		phone: '+358401234567',
		backupPhone: '+358409876543',
		team: 'Test',
		links: 'example.com',
		freeForm: 'free text',
		fileName: 'cv1.txt',
		filePath: 'testCN1'
	};
	const applicationData2 = {
		firstName: 'Test',
		lastName: 'User',
		backupEmail: 'test1@example.com',
		phone: '+358401234567',
		backupPhone: '+358409876543',
		team: 'Test',
		links: 'example.com',
		freeForm: 'free text',
		fileName: 'cv1.txt',
		filePath: 'testCN2'
	};


	beforeAll(async () => {
		await testLibApplication.deleteApplicationWithFilePath(applicationData1.filePath);
		await testLibApplication.deleteApplicationWithFilePath(applicationData2.filePath);
		await testLibUser.deleteUserWithUsername('testCN1');
		await testLibUser.deleteUserWithUsername('testCN2');

		session = await libSession.createSession('testCN', '::1');

		application1 = await testLibApplication
			.createApplicationWithFile(session, applicationData1);
		application2 = await testLibApplication
			.createApplicationWithFile(session, applicationData2);

		user1 = await libUser.createUser('testCN1');
		user2 = await libUser.createUser('testCN2');

		commonNote = await libNote
			.createNote(user1, null, false, 'test note');
		commonSharedNote = await libNote
			.createNote(user1, null, true, 'test note');
		applicationNote = await libNote
			.createNote(user1, application1, false, 'test note');
		applicationSharedNote = await libNote
			.createNote(user1, application1, true, 'test note');
	});


	afterAll(async () => {
		await testLibApplication.deleteApplicationWithFile(application1);
		await testLibApplication.deleteApplicationWithFile(application2);

		await testLibSession.deleteSession(session);

		await user1.delete();
		await user2.delete();

		await commonNote.delete();
		await commonSharedNote.delete();
		await applicationNote.delete();
		await applicationSharedNote.delete();
	});


	test('Check created objects', async () => {
		expect(commonNote)
			.toMatchObject({
				userID: user1.id,
				applicationID: null,
				shared: false,
				message: 'test note'
			});
		expect(commonSharedNote)
			.toMatchObject({
				userID: user1.id,
				applicationID: null,
				shared: true,
				message: 'test note'
			});
		expect(applicationNote)
			.toMatchObject({
				userID: user1.id,
				applicationID: application1.id,
				shared: false,
				message: 'test note'
			});
		expect(applicationSharedNote)
			.toMatchObject({
				userID: user1.id,
				applicationID: application1.id,
				shared: true,
				message: 'test note'
			});
		
		expect(commonNote.id).toBeDefined();
		expect(commonSharedNote.id).toBeDefined();
		expect(applicationNote.id).toBeDefined();
		expect(applicationSharedNote.id).toBeDefined();
		
		expect(commonNote.time).toBeDefined();
		expect(commonSharedNote.time).toBeDefined();
		expect(applicationNote.time).toBeDefined();
		expect(applicationSharedNote.time).toBeDefined();
	});


	test('Add note without message', async () => {
		expect(await libNote
			.createNote(user1, null, false, null))
			.toBe('NO_MESSAGE');
		expect(await libNote
			.createNote(user1, application1, false, null))
			.toBe('NO_MESSAGE');
	});


	test('Get notes by id', async () => {
		expect(await libNote.getNoteByID(commonNote.id))
			.toMatchObject(commonNote);
		expect(await libNote.getNoteByID(commonSharedNote.id))
			.toMatchObject(commonSharedNote);
		expect(await libNote.getNoteByID(applicationNote.id))
			.toMatchObject(applicationNote);
		expect(await libNote.getNoteByID(applicationSharedNote.id))
			.toMatchObject(applicationSharedNote);
	});


	test('Get invalid note', async () => {
		expect(await libNote.getNoteByID(-1))
			.toBe('NO_NOTE');
	});


	test('Get common notes', async () => {
		expect(await libNote.getCommonNotes(user1))
			.toContainEqual(commonNote);
		expect(await libNote.getCommonNotes(user1))
			.toContainEqual(commonSharedNote);

		expect(await libNote.getCommonNotes(user2))
			.not.toContainEqual(commonNote);
		expect(await libNote.getCommonNotes(user2))
			.toContainEqual(commonSharedNote);
	});


	test('Get application notes', async () => {
		expect(await libNote
			.getApplicationNotes(user1, application1))
			.toContainEqual(applicationNote);
		expect(await libNote
			.getApplicationNotes(user1, application1))
			.toContainEqual(applicationSharedNote);

		expect(await libNote
			.getApplicationNotes(user1, application2))
			.not.toContainEqual(applicationNote);
		expect(await libNote
			.getApplicationNotes(user1, application2))
			.not.toContainEqual(applicationSharedNote);

		expect(await libNote
			.getApplicationNotes(user2, application1))
			.not.toContainEqual(applicationNote);
		expect(await libNote
			.getApplicationNotes(user2, application1))
			.toContainEqual(applicationSharedNote);
	});


	test('Edit note', async () => {
		expect(await commonNote.updateMessage(null))
			.toBe('NO_MESSAGE');
		expect(await commonNote.updateMessage('new message'))
			.toBe('OK');
		expect(await libNote.getNoteByID(commonNote.id))
			.toMatchObject(commonNote);
	});


	test('Delete note', async () => {
		expect(await commonNote.delete())
			.toBe('OK');
		expect(await libNote.getCommonNotes(user1))
			.not.toContainEqual(commonNote);
	});
});
