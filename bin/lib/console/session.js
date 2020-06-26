const uuid = require('uuid');

const openDB = require('../db');


class Session {
	id;
	userID;
	uuid;
	ip;
	ua;
	time;
	

	static async createSession(userID, ua, ip) {
		const session = new Session();

		session.uuid = uuid.v4();
		session.time = Date.now();
		session.userID = userID;
		session.ua = ua;
		session.ip = ip;

		const db = await openDB();
		await db.run(`insert into console_sessions(user_id, uuid, ip, ua, time)
                  values ($id, $uuid, $ip, $ua, $time)`, {
			$id: session.userID, $uuid: session.uuid, $ip: session.ip,
			$ua: session.ua, $time: session.time
		});

		session.id = (await db.get(`select last_insert_rowid() as id`)).id;
		await db.close();

		return session;
	}


	static async getSessionByID(sessionID) {
		const session = new Session();

		const db = await openDB();
		const sessionData = await db.get(`select id,
                                         user_id as userID,
                                         uuid,
                                         ip,
                                         ua,
                                         time
                                  from console_sessions
                                  where id=$id`, {$id: sessionID});
		await db.close();

		if (!sessionData) {
			return 'NO_SESSION'
		} else {
			Object.assign(session, sessionData);
			return session;
		}
	}


	async getSessionByUUID(sessionUUID) {
		const session = new Session();

		const db = await openDB();
		const sessionData = await db.get(`select id,
                                         user_id as userID,
                                         uuid,
                                         ip,
                                         ua,
                                         time
                                  from console_sessions
                                  where uuid=$uuid`, {$uuid: sessionUUID});
		await db.close();

		if (!sessionData) {
			return 'NO_SESSION';
		} else {
			Object.assign(session, sessionData);
			return session;
		}
	}


	async delete() {
		const db = await openDB();
		await db.run(`delete
                  from console_sessions
                  where id=$id`, {$id: this.id});
		await db.close();
	}
}


module.exports = Session;
