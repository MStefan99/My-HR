const uuid = require('uuid');

const openDB = require('../db');


async function createSession(userID, userAgent, ip) {
	const sessionUUID = uuid.v4();
	const now = Date.now();

	const db = await openDB();
	await db.run(`insert into console_sessions(user_id, uuid, ip, ua, time)
                  values ($uid, $uuid, $ip, $ua, $time)`, {
		$uid: userID, $uuid: sessionUUID, $ip: ip,
		$ua: userAgent, $time: now
	});
	const session = {userId: userID, uuid: sessionUUID, ip: ip, ua: userAgent, time: now};
	session.id = (await db.get(`select last_insert_rowid() as id`)).id;
	await db.close();

	return session;
}


async function getSessionByID(sessionID) {
	const db = await openDB();
	const session = await db.get(`select id,
                                         user_id as userID,
                                         uuid,
                                         ip,
                                         ua,
                                         time
                                  from console_sessions
                                  where id=$id`, {$id: sessionID});
	await db.close();
	return session;
}

async function getSessionByUUID(sessionUUID) {
	const db = await openDB();
	const session = await db.get(`select id,
                                         user_id as userID,
                                         uuid,
                                         ip,
                                         ua,
                                         time
                                  from console_sessions
                                  where uuid=$uuid`, {$uuid: sessionUUID});
	await db.close();
	return session;
}


async function deleteSession(session) {
	const db = await openDB();
	await db.run(`delete
                  from console_sessions
                  where id=$id`, {$id: session.id});
	await db.close();
}


async function deleteAllUserSessions(user) {
	const db = await openDB();
	await db.run(`delete
                  from console_sessions
                  where user_id=$id`, {$id: user.id});
	await db.close();
}


module.exports = {
	createSession: createSession,
	getSessionByID: getSessionByID,
	getSessionByUUID: getSessionByUUID,
	deleteSession: deleteSession,
	deleteAllUserSessions: deleteAllUserSessions
};
