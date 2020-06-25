const libApplication = require('../lib/application');
const libSession = require('../lib/user/session');

const testLibApplication = require('./testLib/application');
const testLibSession = require('./testLib/user/session');


describe('With test sessions', () => {
	let createdSession, createdApplication1, createdApplication2;

	const username1 = 'user1';
	const email1 = username1 + '@metropolia.fi';
	const username2 = 'user2';
	const email2 = username2 + '@metropolia.fi';
	const application1 = {
		firstName: 'Test',
		lastName: username1,
		email: email1,
		backupEmail: 'test1@example.com',
		phone: '+358401234567',
		backupPhone: '+358409876543',
		team: 'Test',
		links: 'example.com',
		freeForm: 'free text',
		fileName: 'cv1.txt',
		filePath: 'test1'
	};
	const application2 = {
		firstName: 'Test',
		lastName: username1,
		email: email1,
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
		createdSession = await libSession.createSession(username1, '::1');
		createdApplication1 = await testLibApplication.createApplication(application1);
		createdApplication2 = await testLibApplication.createApplication(application2);
	});


	afterAll(async () => {
		await testLibSession.deleteSession(createdSession);
		await testLibApplication.deleteApplication(createdApplication1);
		await testLibApplication.deleteAttachment(createdApplication1);
		await testLibApplication.deleteApplication(createdApplication2);
		await testLibApplication.deleteAttachment(createdApplication2);
	});


	test('Check created application', async () => {
		expect(createdApplication1).toMatchObject(application1);
		expect(createdApplication2).toMatchObject(application2);
	});


	test('Retrieve user applications', async () => {
		expect(await libApplication.getUserApplications(email1))
			.toMatchObject([
				{
					"accepted": 0,
					"backupEmail": "test1@example.com",
					"fileName": "cv1.txt",
					"filePath": "test1",
					"phone": "+358401234567"
				},
				{
					"accepted": 0,
					"backupEmail": "test2@example.com",
					"fileName": "cv2.txt",
					"filePath": "test2",
					"phone": "+358401234567"
				}
			]);
		expect(await libApplication.getUserApplications(email2))
			.toHaveLength(0);
	});


	test('Retrieve invalid attachment', async () => {
		expect(await libApplication.getUserAttachment(email1, ''))
			.toBe('NO_APPLICATION');
	}) ;


	test('Retrieve another user\'s attachment', async () => {
		expect(await libApplication.getUserAttachment(email2, 'test2'))
			.toBe('NOT_ALLOWED');
	});


	test('Retrieve user attachment', async () => {
		expect(await libApplication.getUserAttachment(email1, 'test1'))
			.toMatchObject({fileName: 'cv1.txt', filePath: 'test1'});
		expect(await libApplication.getUserAttachment(email1, 'test2'))
			.toMatchObject({fileName: 'cv2.txt', filePath: 'test2'});
	});


	test('Delete invalid application', async () => {
		const applicationCount = (await libApplication.getUserApplications(email1)).length;

		expect(await libApplication.deleteUserApplication(email1, 0))
			.toBe('NO_APPLICATION');
		expect(await libApplication.getUserApplications(email1))
			.toHaveLength(applicationCount);
	});


	test('Delete another user\'s application', async () => {
		const applicationCount = (await libApplication.getUserApplications(email1)).length;

		expect(await libApplication.deleteUserApplication(email2, createdApplication1.id))
			.toBe('NOT_ALLOWED');
		expect(await libApplication.getUserApplications(email1))
			.toHaveLength(applicationCount);
	});


	test('Delete accepted application', async () => {
		const applicationCount = (await libApplication.getUserApplications(email1)).length;

		await testLibApplication.setApplicationAcceptedStatus(createdApplication1, 1);
		expect(await libApplication.deleteUserApplication(email1, createdApplication1.id))
			.toBe('ALREADY_ACCEPTED');
		expect(await libApplication.getUserApplications(email1))
			.toHaveLength(applicationCount);
	});


	test('Delete application', async () => {
		const applicationCount = (await libApplication.getUserApplications(email1)).length;

		await testLibApplication.setApplicationAcceptedStatus(createdApplication1, -1);
		expect(await libApplication.deleteUserApplication(email1, createdApplication1.id))
			.toBe('OK');
		expect(await libApplication.getUserApplications(email1))
			.toHaveLength(applicationCount - 1);
	});
});
