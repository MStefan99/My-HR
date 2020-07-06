'use strict';

const openDB = require('../../../lib/db');


async function deleteSession(session) {
	if (session) {
		const db = await openDB();
		await db.run(`delete
                      from sessions
                      where id=$id`, {$id: session.id});
		await db.close();
	}
}


module.exports = {
	deleteSession: deleteSession
};