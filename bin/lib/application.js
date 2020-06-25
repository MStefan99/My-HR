const openDB = require('./db');
const fs = require('fs');
const path = require('path');
const util = require('util');
unlink = util.promisify(fs.unlink);


async function saveNewApplication(application) {
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
		$fn: application.firstName.trim(),
		$ln: application.lastName.trim(),
		$email: application.email.trim(),
		$be: application.backupEmail.trim(),
		$phone: application.phone.trim(),
		$bp: application.backupPhone.trim(),
		$team: application.team,
		$links: application.links,
		$ff: application.freeForm,
		$fln: application.fileName,
		$flp: application.filePath
	});

	application.id = (await db.get(`select last_insert_rowid() as id`)).id;
	await db.close();
	return application;
}


async function getApplicationByID(applicationID) {
	const db = await openDB();
	const application = await db.get(`select id,
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
	return application;
}


async function getAllApplications() {
	const db = await openDB();
	const applications = await db.run(`select id,
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
	return applications;
}


async function getApplicationsByType(type) {
	const db = await openDB();
	let applications;
	switch (type) {
		case 'all':
		default:
			applications = await getAllApplications();
			break;
		case 'stars':
			applications = await db.all(`select a.id,
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
			applications = await db.all(`select id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications
                                         where accepted=1`);
			break;
		case 'rejected':
			applications = await db.all(`select id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications
                                         where accepted=-1`);
			break;
		case 'pending':
			applications = await db.all(`select id,
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
	return applications;
}


async function getApplicationStar(application, user) {
	const db = await openDB();

	const starred = await db.get(`select 1
                                  from console_stars
                                  where user_id=$uid
                                    and application_id=$aid`,
		{$aid: application.id, $uid: user.id});
	await db.close();
	return !!starred;
}


async function getUserApplications(email) {
	const db = await openDB();
	const applications = await db.all(`select id,
                                              backup_email as backupEmail,
                                              phone,
                                              file_name    as fileName,
                                              file_path    as filePath,
                                              accepted
                                       from applications
                                       where email=$email`, {$email: email});
	await db.close();
	return applications;
}


async function getUserAttachment(email, path) {
	const db = await openDB();

	const application = await db.get(`select email,
                                             file_name as fileName,
                                             file_path as filePath
                                      from applications
                                      where file_path=$path`, {$path: path});

	await db.close();
	if (!application) {
		return 'NO_APPLICATION';
	} else if (application.email !== email) {
		return 'NOT_ALLOWED'
	} else {
		return application
	}
}


async function deleteUserApplication(application, email) {
	if (!application) {
		return 'NO_APPLICATION';
	} else if (email !== application.email) {
		return 'NOT_ALLOWED';
	} else if (application.accepted === 1) {
		return 'ALREADY_ACCEPTED';
	} else {
		const db = await openDB();
		await unlink(path.join(__dirname, '..', '..', 'uploads', application.filePath));
		await db.run(`delete
                      from applications
                      where id=$id`,
			{$id: application.id});
		await db.close();
		return 'OK';
	}
}


async function acceptApplication(application) {

}


async function rejectApplication(application) {

}


module.exports = {
	saveNewApplication: saveNewApplication,
	getApplicationByID: getApplicationByID,
	getAllApplications: getAllApplications,
	getApplicationsByType: getApplicationsByType,
	getApplicationStar: getApplicationStar,
	getUserApplications: getUserApplications,
	deleteUserApplication: deleteUserApplication,
	getUserAttachment: getUserAttachment
};