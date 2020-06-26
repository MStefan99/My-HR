const libApplication = require('../lib/application');
const libSession = require('../lib/user/session');

const testLibApplication = require('./testLib/application');
const testLibSession = require('./testLib/user/session');


describe('With test sessions', () => {
	let session1,
		session2,
		application1,
		application2;

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
		filePath: 'test1'
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
		filePath: 'test2'
	};


	beforeAll(async () => {
		await testLibApplication.deleteApplicationWithFile('test1');
		await testLibApplication.deleteApplicationWithFile('test2');

		session1 = await libSession.createSession('user1', '::1');
		session2 = await libSession.createSession('user2', '::2');

		application1 = await testLibApplication.createApplication(session1, applicationData1);
		application2 = await testLibApplication.createApplication(session1, applicationData2);
	});


	afterAll(async () => {
		await testLibSession.deleteSession(session1);
		await testLibSession.deleteSession(session2);
		await testLibApplication.deleteApplication(application1);
		await testLibApplication.deleteAttachment(application1);
		await testLibApplication.deleteApplication(application2);
		await testLibApplication.deleteAttachment(application2);
	});


	test('Check created objects', async () => {
		expect(application1).toMatchObject(applicationData1);
		expect(application2).toMatchObject(applicationData2);
	});


	test('Check created applications', async () => {
		const applications = await libApplication.getAllApplications();
		expect(applications).toContainEqual(application1);
		expect(applications).toContainEqual(application2);
	});


	test('Retrieve session applications', async () => {
		expect(await libApplication.getApplicationsBySession(session1))
			.toMatchObject([applicationData1, applicationData2]);
		expect(await libApplication.getApplicationsBySession(session2))
			.toHaveLength(0);
	});


	test('Retrieve invalid attachment', async () => {
		expect(await libApplication.getAttachment(null, session1))
			.toBe('NO_APPLICATION');
	});


	test('Retrieve another user\'s attachment', async () => {
		expect(await libApplication.getAttachment('test2', session2))
			.toBe('NOT_ALLOWED');
	});


	test('Retrieve user attachment', async () => {
		expect(await libApplication.getAttachment('test1', session1))
			.toMatchObject({fileName: 'cv1.txt', filePath: 'test1'});
		expect(await libApplication.getAttachment('test2', session1))
			.toMatchObject({fileName: 'cv2.txt', filePath: 'test2'});
	});


	test('Delete another user\'s application', async () => {
		const applications = await libApplication.getApplicationsBySession(session1);

		expect(await applications[1].delete(session2))
			.toBe('NOT_ALLOWED');
		expect(await libApplication.getApplicationsBySession(session1))
			.toContainEqual(applications[1]);
	});


	test('Delete accepted application', async () => {
		const applications = await libApplication.getApplicationsBySession(session1);

		await testLibApplication.setApplicationAcceptedStatus(applications[1], 1);
		expect(await applications[1].delete(session1))
			.toBe('ALREADY_ACCEPTED');
		expect(await libApplication.getApplicationsBySession(session1))
			.toContainEqual(applications[1]);
	});


	test('Delete application', async () => {
		const applications = await libApplication.getApplicationsBySession(session1);

		await testLibApplication.setApplicationAcceptedStatus(applications[1], -1);
		expect(await applications[1].delete(session1))
			.toBe('OK');
		expect(await libApplication.getApplicationsBySession(session1))
			.not.toContainEqual(applications[1]);
	});
});
