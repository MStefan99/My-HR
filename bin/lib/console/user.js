const uuid = require('uuid');
const crypto = require('crypto');

const openDB = require('../db');
const libSession = require('./session');
const libApplication = require('../application');


const hashSecret = 'Your HR secret key';


class User {
	id;
	username;
	admin;
	setupCode;
	passwordHash = null;
	secret = null;


	static async createUser(username, admin) {
		const user = new User();

		user.username = username;
		user.uuid = uuid.v4();
		user.setupCode = uuid.v4();
		user.admin = !!admin;

		const db = await openDB();
		try {
			await db.run(`insert into console_users(username, admin, uuid, setup_code)
                          values ($username, $admin, $uuid, $code)`, {
				$username: user.username,
				$uuid: user.uuid,
				$admin: user.admin ? 1 : 0,
				$code: user.setupCode
			});
		} catch (e) {
			await db.close();
			return 'DUPLICATE_USERNAME';
		}

		user.id = (await db.get(`select last_insert_rowid() as id`)).id;
		await db.close();
		return user;
	}


	static async getUserByID(userID) {
		const user = new User();

		const db = await openDB();
		const userData = await db.get(`select id,
                                              username,
                                              password_hash as passwordHash,
                                              uuid,
                                              setup_code    as setupCode,
                                              admin,
                                              secret
                                       from console_users
                                       where id=$id`, {$id: userID});
		await db.close();

		if (!userData) {
			return 'NO_USER'
		} else {
			Object.assign(user, userData);
			user.admin = !!userData.admin;
			return user;
		}
	}


	static async getUserByUUID(userUUID) {
		const user = new User();

		const db = await openDB();
		const userData = await db.get(`select id,
                                              username,
                                              password_hash as passwordHash,
                                              uuid,
                                              setup_code    as setupCode,
                                              admin,
                                              secret
                                       from console_users
                                       where uuid=$uuid`, {$uuid: userUUID});
		await db.close();

		if (!userData) {
			return 'NO_USER'
		} else {
			Object.assign(user, userData);
			user.admin = !!userData.admin;
			return user;
		}
	}


	static async getUserByUsername(username) {
		const user = new User();

		const db = await openDB();
		const userData = await db.get(`select id,
                                              username,
                                              password_hash as passwordHash,
                                              uuid,
                                              setup_code    as setupCode,
                                              admin,
                                              secret
                                       from console_users
                                       where username=$username`, {$username: username});
		await db.close();

		if (!userData) {
			return 'NO_USER'
		} else {
			Object.assign(user, userData);
			user.admin = !!userData.admin;
			return user;
		}
	}


	static async getAllUsers() {
		const users = [];

		const db = await openDB();
		const allUserData = await db.all(`select id,
                                                 username,
                                                 password_hash as passwordHash,
                                                 uuid,
                                                 setup_code    as setupCode,
                                                 admin,
                                                 secret
                                          from console_users`);
		await db.close();

		for (const userData of allUserData) {
			const user = new User();

			Object.assign(user, userData);
			user.admin = !!userData.admin;
			users.push(user)
		}
		return users;
	}


	verifyPassword(password) {
		const hash = crypto.createHmac('sha512', hashSecret);
		hash.update(password);
		return this.passwordHash === hash.digest('hex');
	}


	async updatePassword(password) {
		if (!password) {
			return 'NO_PASSWORD'
		} else if (password.length < 8) {
			return 'TOO_SHORT';
		} else {
			const db = await openDB();

			const hash = crypto.createHmac('sha512', hashSecret);
			hash.update(password);
			this.passwordHash = hash.digest('hex');

			await db.run(`update console_users
                          set password_hash=$hash,
                              setup_code=null
                          where id=$id`, {
				$id: this.id,
				$hash: this.passwordHash,
			});
			await db.close();
			return 'OK';
		}
	}


	async setSecret(secret) {
		const db = await openDB();
		this.secret = secret;

		await db.run(`update console_users
                      set secret=$secret
                      where id=$id`, {$secret: secret, $id: this.id});
		await db.close();
		return 'OK';
	}


	async getSessions() {
		const sessions = [];

		const db = await openDB();
		const allSessionData = await db.all(`select id,
                                                    user_id as userID,
                                                    uuid,
                                                    ip,
                                                    ua,
                                                    time
                                             from console_sessions
                                             where user_id=$id`, {$id: this.id});
		await db.close();

		for (const sessionData of allSessionData) {
			const session = new libSession();
			Object.assign(session, sessionData);
			sessions.push(session);
		}
		return sessions;
	}


	async getStarredApplications() {
		const applications = [];

		const db = await openDB();
		const allApplicationData = await db.all(`select a.id,
                                                        first_name   as firstName,
                                                        last_name    as lastName,
                                                        email,
                                                        backup_email as backupEmail,
                                                        phone,
                                                        backup_phone as backupPhone,
                                                        team,
                                                        links,
                                                        free_form    as freeForm,
                                                        file_name    as fileName,
                                                        file_path    as filePath,
                                                        accepted
                                                 from applications a
                                                          left join
                                                      console_stars cs on a.id=cs.application_id
                                                 where cs.user_id=$id
                                                 order by cs.id desc`, {$id: this.id});

		await db.close();

		for (const applicationData of allApplicationData) {
			const application = new libApplication();

			Object.assign(application, applicationData);
			applications.push(application)
		}
		return applications;
	}


	async hasStarredApplication(application) {
		const db = await openDB();

		const starred = await db.get(`select 1
                                      from console_stars
                                      where user_id=$uid
                                        and application_id=$aid`,
			{$aid: application.id, $uid: this.id});
		await db.close();
		return !!starred;
	}


	async starApplication(application) {
		const db = await openDB();
		const starred = !!(await db.get(`select 1
                                         from console_stars
                                         where user_id=$uid
                                           and application_id=$aid`,
			{$uid: this.id, $aid: application.id}));
		if (starred) {
			await db.close();
			return 'ALREADY_STARRED';
		} else {
			await db.run(`insert into console_stars(user_id, application_id)
                          values ($uid, $aid)`,
				{$uid: this.id, $aid: application.id});
			await db.close();
			return 'OK';
		}
	}


	async unstarApplication(application) {
		const db = await openDB();

		const starred = !!(await db.get(`select 1
                                         from console_stars
                                         where user_id=$uid
                                           and application_id=$aid`,
			{$uid: this.id, $aid: application.id}));
		if (!starred) {
			await db.close();
			return 'NOT_STARRED';
		} else {
			await db.run(`delete
                          from console_stars
                          where user_id=$uid
                            and application_id=$aid`,
				{$uid: this.id, $aid: application.id});
			await db.close();
			return 'OK';
		}
	}


	async deleteAllSessions() {
		const db = await openDB();
		await db.run(`delete
                      from console_sessions
                      where user_id=$id`, {$id: this.id});
		await db.close();
		return 'OK';
	}


	async delete() {
		if (this.username === 'admin') {
			return 'CANNOT_DELETE_ADMIN';
		} else {
			const db = await openDB();
			await db.run(`delete
                          from console_users
                          where id=$id`, {$id: this.id});
			await db.close();
			return 'OK';
		}
	}
}


module.exports = User;
