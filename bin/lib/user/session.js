'use strict';

const openDB = require('../db');
const uuid = require('uuid');


class Session {
	id;
	uuid;
	email;
	ip;
	createdAt;


	static async createSession(username, ip) {
		const session = new Session();

		session.uuid = uuid.v4();
		session.createdAt = Date.now();
		session.email = username.trim() + '@metropolia.fi';
		session.ip = ip;

		const db = await openDB();
		await db.run(`insert into sessions(uuid, email, ip, created_at)
                      values ($uuid, $email, $ip, $time)`,
			{$uuid: session.uuid, $email: session.email, $ip: session.ip, $time: session.createdAt});

		session.id = (await db.get(`select last_insert_rowid() as id`)).id;
		await db.close();

		return session;
	}


	static async getSessionByID(sessionID) {
		const session = new Session();

		const db = await openDB();
		const sessionData = await db.get(`select id,
                                                 uuid,
                                                 email,
                                                 ip,
                                                 created_at as createdAt
                                          from sessions
                                          where id=$id`, {$id: sessionID});
		await db.close();

		if (!sessionData) {
			return 'NO_SESSION'
		} else {
			Object.assign(session, sessionData);
			return session;
		}
	}


	static async getSessionByUUID(sessionUUID) {
		const session = new Session();

		const db = await openDB();
		const sessionData = await db.get(`select id,
                                                 uuid,
                                                 email,
                                                 ip,
                                                 created_at as createdAt
                                          from sessions
                                          where uuid=$uuid`, {$uuid: sessionUUID});
		await db.close();

		if (!sessionData) {
			return 'NO_SESSION'
		} else {
			Object.assign(session, sessionData);
			return session;
		}
	}
}


module.exports = Session;
