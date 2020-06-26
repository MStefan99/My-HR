const libUser = require('../../lib/console/user');

const testLibUser = require('../testLib/console/user');


describe('With test user', () => {
	let user, admin;

	const username = 'test';
	const adminUsername = 'testAdmin';

	const userData = {username: username, admin: false, secret: null, passwordHash: null};
	const adminData = {username: adminUsername, admin: true, secret: null, passwordHash: null};


	beforeAll(async () => {
		await testLibUser.deleteUserWithUsername(username);
		await testLibUser.deleteUserWithUsername(adminUsername);
		user = await libUser.createUser(username);
		admin = await libUser.createUser(adminUsername, 1);
	});


	afterAll(async () => {
		await testLibUser.deleteUserWithUsername(username);
		await testLibUser.deleteUserWithUsername(adminUsername);
	});


	test('Check created objects', () => {
		expect(user).toMatchObject(userData);
		expect(admin).toMatchObject(adminData);
	});


	test('Check created users', async () => {
		const users = await libUser.getAllUsers();
		expect(users).toContainEqual(user);
		expect(users).toContainEqual(admin);
	});


	test('Add user with same username', async () => {
		const users = await libUser.getAllUsers();

		expect(await libUser.createUser(username))
			.toBe('DUPLICATE_USERNAME');
		expect(users).toEqual(await libUser.getAllUsers());
	});


	test('Retrieve user by ID', async () => {
		const retrievedTestUser = await libUser.getUserByID(user.id);
		const retrievedAdminUser = await libUser.getUserByID(admin.id);
		expect(retrievedTestUser).toEqual(user);
		expect(retrievedAdminUser).toEqual(admin);
	});


	test('Retrieve user by UUID', async () => {
		const retrievedTestUser = await libUser.getUserByUUID(user.uuid);
		const retrievedAdminUser = await libUser.getUserByUUID(admin.uuid);
		expect(retrievedTestUser).toEqual(user);
		expect(retrievedAdminUser).toEqual(admin);
	});


	test('Retrieve invalid users', async () => {
		expect(await libUser.getUserByID(0)).toBe('NO_USER');
		expect(await libUser.getUserByUUID(0)).toBe('NO_USER');
	});


	test('Set user 2FA secret', async () => {
		await user.setSecret('test');
		expect(user).toHaveProperty('secret', 'test');
		expect(await libUser.getUserByID(user.id)).toHaveProperty('secret', 'test');
	});


	test('Update user password', async () => {
		expect(await user.updatePassword('a'))
			.toBe('TOO_SHORT');
		expect(user.passwordHash).toBeNull();

		await user.updatePassword('testPassword');
		const retrievedUser = await libUser.getUserByID(user.id);

		expect(user.passwordHash).not.toBeNull();
		expect(retrievedUser.passwordHash).not.toBeNull();

		expect(user.verifyPassword('testPassword')).toBeTruthy();
		expect(retrievedUser.verifyPassword('testPassword')).toBeTruthy();
	});


	test('Delete admin', async () => {
		await libUser.createUser('admin', true);

		const adminUser = await testLibUser.getUserByUsername('admin');
		expect(await adminUser.delete()).toBe('CANNOT_DELETE_ADMIN');
	});


	test('Delete user', async () => {
		await admin.delete();
		expect(await libUser.getAllUsers())
			.not.toContainEqual(admin);
	});
});