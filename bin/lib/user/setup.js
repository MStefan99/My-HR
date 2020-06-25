const openDB = require('../db');


async function createTables() {
	const db = await openDB();
	const tables = await db.all(`select *
                                 from sqlite_master
                                 where type='table'`);
	if (!tables.find(table => table.name === 'sessions')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'sessions.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'applications')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'applications.sql'), 'utf-8'));
	}
	await db.close();
}

async function init() {
	await createTables();
}


module.exports = {
	init: init
}
