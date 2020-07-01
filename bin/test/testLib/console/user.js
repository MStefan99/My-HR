'use strict';

const libUser = require('../../../lib/console/user');
const openDB = require('../../../lib/db');


async function deleteUserWithUsername(username) {
	const db = await openDB();

	await db.run(`delete
                  from console_users
                  where username=$username`,
		{$username: username});
}


async function getUserByUsername(username) {
	const db = await openDB();

	const id = (await db.get(`select id
                              from console_users
                              where username=$username`,
		{$username: username})).id;
	return await libUser.getUserByID(id);
}


module.exports = {
	deleteUserWithUsername: deleteUserWithUsername,
	getUserByUsername: getUserByUsername
};
