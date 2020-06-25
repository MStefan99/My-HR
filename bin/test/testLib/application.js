const libApplication = require('../../lib/application');
const openDB = require('../../lib/db');
const fs = require('fs');
const path = require('path');
const util = require('util');


const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);


async function createApplication(application) {
	const location = path.join(__dirname, '..', '..', '..', 'uploads', application.filePath);
	await writeFile(location, 'test file used in testing');
	return await libApplication.saveNewApplication(application);
}


async function getApplication(id) {
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
                                      where id=$id`, {$id: id});
	await db.close();
	return application;
}


async function setApplicationAcceptedStatus(id, status) {
	const db = await openDB();
	await db.run(`update applications
                  set accepted=$accepted
                  where id=$id`,
		{$accepted: status, $id: id});
	await db.close();
}


async function deleteApplication(id) {
	const db = await openDB();
	const application = await getApplication(id);

	if (application) {
		const location = path.join(__dirname, '..', '..', '..', 'uploads', application.filePath);
		await unlink(location);
		await db.run(`delete
                      from applications
                      where id=$id`, {$id: id});
	}
	await db.close();
}


async function deleteAttachment(filePath) {
	const location = path.join(__dirname, '..', '..', '..', 'uploads', filePath);
	await unlink(location).catch(() => {
	});
}


module.exports = {
	createApplication: createApplication,
	getApplication: getApplication,
	setApplicationAcceptedStatus: setApplicationAcceptedStatus,
	deleteApplication: deleteApplication,
	deleteAttachment: deleteAttachment
}
