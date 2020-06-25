const uuid = require('uuid');
const crypto = require('crypto');

const openDB = require('../db');

const hashSecret = 'Your HR secret key';


async function getUserByID(userID) {
	const db = await openDB();
	const user = await db.get(`select id,
                                      username,
                                      password_hash as passwordHash,
                                      uuid,
                                      setup_code,
                                      admin,
                                      secret
                               from console_users
                               where id=$id`, {$id: userID});
	await db.close();
	return user;
}


async function getUserByUUID(userUUID) {
	const db = await openDB();
	const user = await db.get(`select id,
                                      username,
                                      password_hash as passwordHash,
                                      uuid,
                                      setup_code,
                                      admin,
                                      secret
                               from console_users
                               where uuid=$uuid`, {$uuid: userUUID});
	await db.close();
	return user;
}


async function createNewUser(username, isAdmin) {
	const db = await openDB();

	const userUUID = uuid.v4();
	const setupCode = uuid.v4();
	await db.run(`insert into console_users(username, admin, uuid, setup_code)
                  values ($username, $admin, $uuid, $code)`, {
		$username: username,
		$admin: isAdmin ? 1 : 0,
		$uuid: userUUID,
		$code: setupCode
	}).catch(() => {
		return 'DUPLICATE_USERNAME';
	});

	const user = {username: username, uuid: userUUID, admin: isAdmin, setupCode: setupCode};
	user.id = (await db.get(`select last_insert_rowid() as id`)).id;
	await db.close();

	return user;
}


async function verifyUserPassword(user, password) {
	const hash = crypto.createHmac('sha512', hashSecret);
	hash.update(password);
	return user.passwordHash === hash.digest('hex');
}


async function updateUserPassword(user, password) {
	const db = await openDB();
	const hash = crypto.createHmac('sha512', hashSecret);
	hash.update(password);

	await db.run(`update console_users
                  set password_hash=$hash,
                      setup_code=null
                  where id=$id`, {
		$id: user.id,
		$hash: hash.digest('hex'),
	});
	await db.close();
}


async function updateUserSecret(user, secret) {
	const db = await openDB();

	await db.run(`update console_users
                      set secret=$secret
                      where id=$id`, {$secret: secret, $id: user.id});
	await db.close();
}


module.exports = {
	createNewUser: createNewUser,
	getUserByID: getUserByID,
	getUserByUUID: getUserByUUID,
	verifyUserPassword: verifyUserPassword,
	updateUserPassword: updateUserPassword,
	updateUserSecret: updateUserSecret
};