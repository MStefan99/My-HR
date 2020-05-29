const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');


async function openDB() {
	const db = await sqlite.open({
		filename: 'database/db.sqlite',
		driver: sqlite3.Database
	});
	await db.run(`pragma foreign_keys = on;`);

	return db;
}


module.exports = openDB;