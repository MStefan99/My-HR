'use strict';


const libUser = require('../../lib/console/user');
const libSession = require('../../lib/user/session');
const libProposal = require('../../lib/console/proposal');

const testLibUser = require('../testLib/console/user');
const testLibSession = require('../testLib/user/session');
const testLibApplication = require('../testLib/application');


describe('With test user, session, application and approvals', () => {
	let session,
		application1,
		application2,
		user1,
		user2,
		user3,
		proposal;

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
		filePath: 'testCA1'
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
		filePath: 'testCA2'
	};


	beforeAll(async () => {
		await testLibApplication.deleteApplicationWithFilePath(applicationData1.filePath);
		await testLibApplication.deleteApplicationWithFilePath(applicationData2.filePath);
		await testLibUser.deleteUserWithUsername('testCA1');
		await testLibUser.deleteUserWithUsername('testCA2');
		await testLibUser.deleteUserWithUsername('testCA3');

		session = await libSession.createSession('testCA', '::1');

		application1 = await testLibApplication
			.createApplicationWithFile(session, applicationData1);
		application2 = await testLibApplication
			.createApplicationWithFile(session, applicationData2);

		user1 = await libUser.createUser('testCA1');
		user2 = await libUser.createUser('testCA2');
		user3 = await libUser.createUser('testCA3');
	});


	afterAll(async () => {
		await testLibApplication.deleteApplicationWithFile(application1);
		await testLibApplication.deleteApplicationWithFile(application2);

		await testLibSession.deleteSession(session);

		await user1.delete();
		await user2.delete();
		await user3.delete();
	});


	test('Check created object', async () => {
		proposal = await libProposal
			.createProposal(user1, application1, 1);

		expect(proposal.id).toBeDefined();
		expect(proposal.userID).toEqual(user1.id);
		expect(proposal.applicationID).toEqual(application1.id);

		expect(await libProposal
			.createProposal(user1, application1, 1))
			.toBe('ALREADY_EXISTS');
	});


	test('Create invalid approval', async () => {
		expect(await libProposal
			.createProposal(user1, application1, 0))
			.toBe('INVALID_STATUS');
		expect(await libProposal
			.createProposal(user1, application1, 2))
			.toBe('INVALID_STATUS');
	});


	test('Get approval', async () => {
		expect(await libProposal
			.getProposal(user1, application1))
			.toMatchObject(proposal);

		expect(await libProposal
			.getApplicationProposalCount(application1))
			.toEqual({accepted: 1});
	});


	test('Delete approval', async () => {
		await proposal.delete();
		expect(await libProposal
			.getProposal(user1, application1))
			.toBe('NO_PROPOSAL');
	});


	test('Create different approvals', async () => {
		const approval1 = await libProposal
			.createProposal(user1, application1, 1);
		const approval2 = await libProposal
			.createProposal(user2, application1, -1);

		expect(application1.accepted)
			.toBe(0);

		expect(await approval1.delete())
			.toBe('OK');
		expect(await approval2.delete())
			.toBe('OK');
	});


	test('Accept application', async () => {
		const approval1 = await libProposal
			.createProposal(user1, application1, 1, 2);
		expect(await libProposal
			.createProposal(user2, application1, 1, 2))
			.toBe('ACCEPTED');
		const approval2 = await libProposal.getProposal(user2, application1);

		expect(await approval1.delete())
			.toBe('ALREADY_ACCEPTED');

		expect(await approval2.delete())
			.toBe('ALREADY_ACCEPTED');

		expect(await libProposal
			.getApplicationProposalCount(application1))
			.toEqual({accepted: 2});
		expect(application1.accepted)
			.toBe(1);
		expect(await libProposal
			.createProposal(user3, application1, 1))
			.toBe('ALREADY_ACCEPTED');
	});


	test('Reject application', async () => {
		const approval1 = await libProposal
			.createProposal(user1, application2, -1, 2);
		expect(await libProposal
			.createProposal(user2, application2, -1, 2))
			.toBe('REJECTED');
		const approval2 = await libProposal.getProposal(user2, application2);

		expect(await approval1.delete())
			.toBe('ALREADY_REJECTED');

		expect(await approval2.delete())
			.toBe('ALREADY_REJECTED');

		expect(await libProposal
			.getApplicationProposalCount(application2))
			.toEqual({rejected: 2});
		expect(application2.accepted)
			.toBe(-1);
		expect(await libProposal
			.createProposal(user3, application2, 1))
			.toBe('ALREADY_REJECTED');
	});
});