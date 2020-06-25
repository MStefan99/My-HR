const openDB = require('../../../lib/db');


async function sessionExists(sessionID) {
	const db = await openDB();

	const session = await db.get(`select 1
                                      from sessions
                                      where id=$id`, {$id: session.id});
	await db.close();
	return !!session;
}


async function deleteSession(session) {
	if (session) {
		const db = await openDB();
		await db.run(`delete
                  from sessions
                  where id=$id`, {$id: session.id});
		await db.close();
	} else {
		throw new Error('No session!');
	}
}


module.exports = {
	deleteSession: deleteSession
};