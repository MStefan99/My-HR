'use strict';

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const openDB = require('../db');


async function addAdmin() {
	const db = await openDB();
	const users = await db.get(`select *
                                from console_users`);
	if (!users) {
		await db.run(`insert into console_users(id, 
                          username, 
                          uuid, 
                          admin, 
                          setup_code,
                          password_hash,
                          secret)
                      values (0, 'System', $id, 1, null, 'hash', 'secret')`, {$id: uuid.v4()});
		await db.run(`insert into console_users(username, uuid, admin, setup_code)
                      values ('admin', $id, 1, 'admin')`, {$id: uuid.v4()});
	}
	await db.close();
}

async function createTables() {
	const db = await openDB();
	const tables = await db.all(`select *
                                 from sqlite_master
                                 where type='table'`);
	if (!tables.find(table => table.name === 'console_users')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_users.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'console_sessions')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_sessions.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'console_stars')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_stars.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'console_notes')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_notes.sql'), 'utf-8'));
	}
	await db.close();
}


async function init() {
	await createTables();
	await addAdmin();
}


module.exports = {
	init: init
};