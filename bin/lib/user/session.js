const openDB = require('../db');
const uuid = require('uuid');



async function createSession(username, ip) {
	const sessionUUID = uuid.v4();
	const createdAt = Date.now();
	const email = username.trim() + '@metropolia.fi';

	const db = await openDB();
	await db.run(`insert into sessions(uuid, email, ip, created_at)
              values ($uuid, $email, $ip, $time)`,
		{$uuid: sessionUUID, $email: email, $ip: ip, $time: createdAt});

	const session = {uuid: sessionUUID, email: email, ip: ip, createdAt: createdAt};
	session.id = (await db.get(`select last_insert_rowid() as id`)).id;
	await db.close();

	return session;
}


async function getSessionByID(sessionID) {
	const db = await openDB();

	const session = await db.get(`select id,
                                     uuid,
                                     email,
                                     ip,
                                     created_at as createdAt
                              from sessions
                              where id=$id`, {$id: sessionID});
	await db.close();

	if (!session) {
		return 'NO_SESSION'
	} else {
		return session;
	}
}


async function getSessionByUUID(sessionUUID) {
	const db = await openDB();

	const session = await db.get(`select id,
                                     uuid,
                                     email,
                                     ip,
                                     created_at as createdAt
                              from sessions
                              where uuid=$uuid`, {$uuid: sessionUUID});
	await db.close();

	if (!session) {
		return 'NO_SESSION'
	} else {
		return session;
	}
}


module.exports = {
	getSessionByID: getSessionByID,
	getSessionByUUID: getSessionByUUID,
	createSession: createSession
};