const openDB = require('../../../lib/db');


async function sessionExists(id) {
	const db = await openDB();

	const session = await db.get(`select 1
                                  from sessions
                                  where id=$id`, {$id: id});
	await db.close();
	return !!session;
}


async function getSession(id) {
	const db = await openDB();
	const session = await db.get(`select id,
                                         uuid,
                                         email,
                                         ip,
                                         created_at as createdAt
                                  from sessions
                                  where id=$id`, {$id: id});
	await db.close();
	return session;
}


async function deleteSession(id) {
	const db = await openDB();
	await db.run(`delete
                  from sessions
                  where id=$id`, {$id: id});
	await db.close();
}


module.exports = {
	getSession: getSession,
	deleteSession: deleteSession
}