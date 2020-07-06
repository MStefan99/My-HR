'use strict';

const libUser = require('../../lib/console/user');
const libSession = require('../../lib/user/session');
const libApplication = require('../../lib/application');

const testLibUser = require('../testLib/console/user');
const testLibSession = require('../testLib/user/session');
const testLibApplication = require('../testLib/application');


describe('With test user', () => {
	let user, admin;

	const username = 'testCU';
	const adminUsername = 'testAdminCU';

	const userData = {username: username, admin: false, secret: null, passwordHash: null};
	const adminData = {username: adminUsername, admin: true, secret: null, passwordHash: null};


	beforeAll(async () => {
		await testLibUser.deleteUserWithUsername(username);
		await testLibUser.deleteUserWithUsername(adminUsername);

		user = await libUser.createUser(username);
		admin = await libUser.createUser(adminUsername, 1);
	});


	afterAll(async () => {
		await user.delete();
		await admin.delete();
	});


	test('Check created objects', () => {
		expect(user).toMatchObject(userData);
		expect(admin).toMatchObject(adminData);

		expect(user.id).toBeDefined();
		expect(user.id).toBeDefined();

		expect(user.uuid).toBeDefined();
		expect(user.uuid).toBeDefined();

		expect(user.setupCode).toBeDefined();
		expect(user.setupCode).toBeDefined();

		expect(user.secret).toBeNull();
		expect(user.secret).toBeNull();

		expect(user.passwordHash).toBeNull();
		expect(user.passwordHash).toBeNull();
	});


	test('Get all users', async () => {
		const users = await libUser.getAllUsers();
		expect(users).toContainEqual(user);
		expect(users).toContainEqual(admin);
	});


	test('Get user by ID', async () => {
		expect(await libUser.getUserByID(user.id))
			.toEqual(user);
		expect(await libUser.getUserByID(admin.id))
			.toEqual(admin);
	});


	test('Get user by UUID', async () => {
		expect(await libUser.getUserByUUID(user.uuid))
			.toEqual(user);
		expect(await libUser.getUserByUUID(admin.uuid))
			.toEqual(admin);
	});


	test('Get user by UUID', async () => {
		expect(await libUser.getUserByUsername(username))
			.toEqual(user);
		expect(await libUser.getUserByUsername(adminUsername))
			.toEqual(admin);
	});


	test('Get invalid user', async () => {
		expect(await libUser.getUserByID(-1))
			.toBe('NO_USER');
		expect(await libUser.getUserByUUID(-1))
			.toBe('NO_USER');
		expect(await libUser.getUserByUsername(null))
			.toBe('NO_USER');
	});


	test('Add user with same username', async () => {
		const users = await libUser.getAllUsers();

		expect(await libUser.createUser(username))
			.toBe('DUPLICATE_USERNAME');
		expect(users).toEqual(await libUser.getAllUsers());
	});


	test('Set 2FA secret', async () => {
		expect(await user.setSecret('test')).toBe('OK');
		expect(user.secret).toBe('test');
		expect((await libUser.getUserByID(user.id)).secret)
			.toBe('test');
	});


	test('Set null password', async () => {
		expect(await user.updatePassword(null))
			.toBe('NO_PASSWORD');
		const retrievedUser = await libUser.getUserByID(user.id);

		expect(user.passwordHash).toBeNull();
		expect(retrievedUser.passwordHash).toBeNull();
	});


	test('Set short password', async () => {
		expect(await user.updatePassword('a'))
			.toBe('TOO_SHORT');
		const retrievedUser = await libUser.getUserByID(user.id);

		expect(user.passwordHash).toBeNull();
		expect(retrievedUser.passwordHash).toBeNull();
	});


	test('Update password', async () => {
		expect(await user.updatePassword('testPassword'))
			.toBe('OK');
		const retrievedUser = await libUser.getUserByID(user.id);

		expect(user.passwordHash).not.toBeNull();
		expect(user.setupCode).toBeNull();
		expect(retrievedUser.passwordHash).not.toBeNull();
		expect(retrievedUser.setupCode).toBeNull();

		expect(user.verifyPassword('testPassword'))
			.toBeTruthy();
		expect(retrievedUser.verifyPassword('testPassword'))
			.toBeTruthy();
	});


	test('Reset password', async () => {
		expect(await user.resetPassword())
			.toBe('OK');
		const retrievedUser = await libUser.getUserByID(user.id);

		expect(user.passwordHash).toBeNull();
		expect(user.setupCode).not.toBeNull();
		expect(retrievedUser.passwordHash).toBeNull();
		expect(retrievedUser.setupCode).not.toBeNull();
	});


	describe('With test session and application', () => {
		let session, application;

		const applicationData = {
			firstName: 'Test',
			lastName: 'User',
			backupEmail: 'test1@example.com',
			phone: '+358401234567',
			backupPhone: '+358409876543',
			team: 'Test',
			links: 'example.com',
			freeForm: 'free text',
			fileName: 'cv1.txt',
			filePath: 'testCU'
		};


		beforeAll(async () => {
			await testLibApplication.deleteApplicationWithFilePath(applicationData.filePath);

			session = await libSession.createSession('testA1', '::1');
			application = await testLibApplication.createApplicationWithFile(session, applicationData);
		});


		afterAll(async () => {
			await testLibApplication.deleteApplicationWithFile(application);
			await testLibSession.deleteSession(session);
		});


		test('Star application', async () => {
			expect(await user.getStarredApplications())
				.toHaveLength(0);
			expect(await user.hasStarredApplication(application))
				.toBe(false);

			expect(await user.starApplication(application))
				.toBe('OK');
			expect(await user.getStarredApplications())
				.toContainEqual(application);
			expect(await user.hasStarredApplication(application))
				.toBe(true);
		});


		test('Star starred application', async () => {
			expect(await user.starApplication(application))
				.toBe('ALREADY_STARRED');
			expect(await user.getStarredApplications())
				.toContainEqual(application);
		});


		test('Unstar application', async () => {
			expect(await user.getStarredApplications())
				.toContainEqual(application);
			expect(await user.hasStarredApplication(application))
				.toBe(true);

			expect(await user.unstarApplication(application))
				.toBe('OK');
			expect(await user.getStarredApplications())
				.toHaveLength(0);
			expect(await user.hasStarredApplication(application))
				.toBe(false);
		});


		test('Unstar not-starred application', async () => {
			expect(await user.unstarApplication(application))
				.toBe('NOT_STARRED');
			expect(await user.getStarredApplications())
				.toHaveLength(0);
		});
	});


	test('Delete admin user', async () => {
		await libUser.createUser('admin', true);

		const adminUser = await testLibUser.getUserByUsername('admin');
		expect(await adminUser.delete()).toBe('CANNOT_DELETE_ADMIN');
	});


	test('Delete System user', async () => {
		await libUser.createUser('System', true);

		const adminUser = await testLibUser.getUserByUsername('System');
		expect(await adminUser.delete()).toBe('CANNOT_DELETE_ADMIN');
	});


	test('Delete user', async () => {
		expect(await admin.delete()).toBe('OK');
		expect(await libUser.getAllUsers())
			.not.toContainEqual(admin);
	});
});