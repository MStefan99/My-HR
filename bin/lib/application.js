const openDB = require('./db');
const fs = require('fs');
const path = require('path');
const util = require('util');
unlink = util.promisify(fs.unlink);


class Application {
	id;
	firstName;
	lastName;
	email;
	backupEmail;
	phone;
	backupPhone;
	team;
	links;
	freeForm;
	fileName;
	filePath;
	accepted = 0;


	static async createApplication(session, applicationData) {
		const application = new Application();

		const db = await openDB();
		await db.run(`insert into applications(first_name,
                                               last_name,
                                               email,
                                               backup_email,
                                               phone,
                                               backup_phone,
                                               team,
                                               links,
                                               free_form,
                                               file_name,
                                               file_path)
                      values ($fn, $ln, $email, $be, $phone, $bp, $team, $links, $ff, $fln, $flp)`, {
			$fn: applicationData.firstName.trim(),
			$ln: applicationData.lastName.trim(),
			$email: session.email.trim(),
			$be: applicationData.backupEmail.trim(),
			$phone: applicationData.phone.trim(),
			$bp: applicationData.backupPhone.trim(),
			$team: applicationData.team,
			$links: applicationData.links,
			$ff: applicationData.freeForm,
			$fln: applicationData.fileName,
			$flp: applicationData.filePath
		});

		Object.assign(application, applicationData);
		application.email = session.email;
		application.id = (await db.get(`select last_insert_rowid() as id`)).id;
		await db.close();
		return application;
	}


	static async getApplicationByID(applicationID) {
		const application = new Application();

		const db = await openDB();
		const applicationData = await db.get(`select id,
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
                                              from applications
                                              where id=$id`, {$id: applicationID});
		await db.close();
		if (!applicationData) {
			return 'NO_APPLICATION';
		} else {
			Object.assign(application, applicationData);
			return application;
		}
	}


	static async getAllApplications() {
		const applications = [];

		const db = await openDB();
		const allApplicationData = await db.all(`select id,
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
                                                 from applications`);
		await db.close();

		for (const applicationData of allApplicationData) {
			const application = new Application();

			Object.assign(application, applicationData);
			applications.push(application)
		}
		return applications;
	}


	static async getApplicationsByType(type) {
		const applications = [];

		const db = await openDB();
		let allApplicationData;
		switch (type) {
			case 'all':
			default:
				allApplicationData = await getAllApplications();
				break;
			case 'stars':
				allApplicationData = await db.all(`select a.id,
                                                          first_name as firstName,
                                                          last_name  as lastName,
                                                          team,
                                                          free_form  as freeForm,
                                                          accepted
                                                   from applications a
                                                            left join
                                                        console_stars cs on a.id=cs.application_id
                                                   where cs.user_id=$id
                                                   order by cs.id desc`, {$id: req.user.id});
				break;
			case 'accepted':
				allApplicationData = await db.all(`select id,
                                                          first_name as firstName,
                                                          last_name  as lastName,
                                                          team,
                                                          free_form  as freeForm,
                                                          accepted
                                                   from applications
                                                   where accepted=1`);
				break;
			case 'rejected':
				allApplicationData = await db.all(`select id,
                                                          first_name as firstName,
                                                          last_name  as lastName,
                                                          team,
                                                          free_form  as freeForm,
                                                          accepted
                                                   from applications
                                                   where accepted=-1`);
				break;
			case 'pending':
				allApplicationData = await db.all(`select id,
                                                          first_name as firstName,
                                                          last_name  as lastName,
                                                          team,
                                                          free_form  as freeForm,
                                                          accepted
                                                   from applications
                                                   where accepted=0`);
				break;
		}
		await db.close();

		for (const applicationData of allApplicationData) {
			const application = new Application();

			Object.assign(application, applicationData);
			applications.push(application)
		}
		return applications;
	}


	static async getApplicationsBySession(session) {
		const applications = [];

		const db = await openDB();
		const allApplicationData = await db.all(`select id,
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
                                                 from applications
                                                 where email=$email`, {$email: session.email});
		await db.close();

		for (const applicationData of allApplicationData) {
			const application = new Application();

			Object.assign(application, applicationData);
			applications.push(application)
		}
		return applications;
	}


	static async getAttachment(path, session) {
		const db = await openDB();

		const application = await db.get(`select email,
                                                 file_name as fileName,
                                                 file_path as filePath
                                          from applications
                                          where file_path=$path`, {$path: path});

		await db.close();
		if (!application) {
			return 'NO_APPLICATION';
		} else if (session.email !== application.email) {
			return 'NOT_ALLOWED';
		} else {
			return {
				fileName: application.fileName,
				filePath: application.filePath
			};
		}
	}


	async isStarredByUser(user) {
		const db = await openDB();

		const starred = await db.get(`select 1
                                      from console_stars
                                      where user_id=$uid
                                        and application_id=$aid`,
			{$aid: application.id, $uid: user.id});
		await db.close();
		return !!starred;
	}


	async delete(session) {
		if (session.email !== this.email) {
			return 'NOT_ALLOWED';
		} else if (this.accepted === 1) {
			return 'ALREADY_ACCEPTED';
		} else {
			const db = await openDB();
			await unlink(path.join(__dirname, '..', '..', 'uploads', this.filePath));
			await db.run(`delete
                          from applications
                          where id=$id`,
				{$id: this.id});
			await db.close();
			return 'OK';
		}
	}


	async accept() {

	}


	async reject() {

	}
}


module.exports = Application;
