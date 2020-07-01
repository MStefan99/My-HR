'use strict';

const libApplication = require('../lib/application');
const libSession = require('../lib/user/session');

const testLibApplication = require('./testLib/application');
const testLibSession = require('./testLib/user/session');


describe('With test sessions and applications', () => {
	let session1,
		session2,
		application1,
		application2;


	const filePath1 = 'fileA1';
	const filePath2 = 'fileA2';
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
		filePath: filePath1,
		accepted: 0
	};
	const applicationData2 = {
		firstName: 'Test',
		lastName: 'User',
		backupEmail: 'test2@example.com',
		phone: '+358401234567',
		backupPhone: '+358409876543',
		team: 'Test',
		links: 'example.com',
		freeForm: 'free text',
		fileName: 'cv2.txt',
		filePath: filePath2,
		accepted: 0
	};


	beforeAll(async () => {
		await testLibApplication.deleteApplicationWithFilePath(applicationData1.filePath);
		await testLibApplication.deleteApplicationWithFilePath(applicationData1.filePath);

		session1 = await libSession.createSession('testA1', '::1');
		session2 = await libSession.createSession('testA2', '::2');

		application1 = await testLibApplication
			.createApplicationWithFile(session1, applicationData1);
		application2 = await testLibApplication
			.createApplicationWithFile(session1, applicationData2);
	});


	afterAll(async () => {
		await testLibApplication.deleteApplicationWithFile(application1);
		await testLibApplication.deleteApplicationWithFile(application2);

		await testLibSession.deleteSession(session1);
		await testLibSession.deleteSession(session2);
	});


	test('Check created objects', async () => {
		expect(application1).toMatchObject(applicationData1);
		expect(application2).toMatchObject(applicationData2);

		expect(application1.email).toEqual(session1.email);
		expect(application2.email).toEqual(session1.email);

		expect(application1.id).toBeDefined();
		expect(application2.id).toBeDefined();
	});


	test('Get all applications', async () => {
		const applications = await libApplication.getAllApplications();
		expect(applications).toContainEqual(application1);
		expect(applications).toContainEqual(application2);

		expect(await libApplication.getApplicationsByType('all'))
			.toEqual(applications);
	});


	test('Get pending applications', async () => {
		const applications = await libApplication.getApplicationsByType('pending');
		expect(applications).toContainEqual(application1);
		expect(applications).toContainEqual(application2);
	});


	test('Get application by id', async () => {
		expect(await libApplication.getApplicationByID(application1.id))
			.toEqual(application1);
		expect(await libApplication.getApplicationByID(application2.id))
			.toEqual(application2);
	});


	test('Get application by file ', async () => {
		expect(await libApplication.getApplicationByFilePath(filePath1))
			.toMatchObject(application1);
		expect(await libApplication.getApplicationByFilePath(filePath2))
			.toMatchObject(application2);
	});


	test('Get invalid application', async () => {
		expect(await libApplication.getApplicationByID(-1))
			.toBe('NO_APPLICATION');
		expect(await libApplication.getApplicationByFilePath(null, session1))
			.toBe('NO_APPLICATION');
	});


	test('Get session applications', async () => {
		expect(await libApplication.getApplicationsBySession(session1))
			.toContainEqual(application1);
		expect(await libApplication.getApplicationsBySession(session1))
			.toContainEqual(application2);
		expect(await libApplication.getApplicationsBySession(session2))
			.toHaveLength(0);
	});


	test('Accept application', async () => {
		expect(await application1.accept()).toBe('OK');
		expect(application1.accepted).toBe(1);
	});


	test('Accept accepted application', async () => {
		expect(await application1.accept()).toBe('ALREADY_ACCEPTED');
		expect(application1.accepted).toBe(1);
	});


	test('Reject accepted application', async () => {
		expect(await application1.reject()).toBe('ALREADY_ACCEPTED');
		expect(application1.accepted).toBe(1);
	});


	test('Reject application', async () => {
		expect(await application2.reject()).toBe('OK');
		expect(application2.accepted).toBe(-1);
	});


	test('Accept rejected application', async () => {
		expect(await application2.accept()).toBe('ALREADY_REJECTED');
		expect(application2.accepted).toBe(-1);
	});


	test('Reject rejected application', async () => {
		expect(await application2.reject()).toBe('ALREADY_REJECTED');
		expect(application2.accepted).toBe(-1);
	});


	test('Get accepted applications', async () => {
		expect(await libApplication.getApplicationsByType('accepted'))
			.toContainEqual(application1);
	});


	test('Get accepted applications', async () => {
		expect(await libApplication.getApplicationsByType('rejected'))
			.toContainEqual(application2);
	});


	test('Delete accepted application', async () => {
		expect(await application1.delete())
			.toBe('ALREADY_ACCEPTED');
		expect(await libApplication.getApplicationsBySession(session1))
			.toContainEqual(application1);
	});


	test('Delete application', async () => {
		await testLibApplication.setApplicationAcceptedStatus(application1, -1);

		expect(await application1.delete())
			.toBe('OK');
		expect(await libApplication.getApplicationsBySession(session1))
			.not.toContainEqual(application1);
	});
});
