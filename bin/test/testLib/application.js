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


async function setApplicationAcceptedStatus(application, status) {
	if (application) {
		const db = await openDB();
		await db.run(`update applications
                  set accepted=$accepted
                  where id=$id`,
			{$accepted: status, $id: application.id});
		await db.close();
	} else {
		throw new Error('No application!');
	}
}


async function deleteApplication(application) {
	if (application) {
		const db = await openDB();

		const location = path.join(__dirname, '..', '..', '..', 'uploads', application.filePath);
		await unlink(location).catch(() => {});
		await db.run(`delete
                  from applications
                  where id=$id`, {$id: application.id});
		await db.close();
	} else {
		throw new Error('No Application!');
	}
}


async function deleteAttachment(application) {
	if (application) {
		const location = path.join(__dirname, '..', '..', '..', 'uploads', application.filePath);
		await unlink(location).catch(() => {});
	} else {
		throw new Error('No application!');
	}
}


module.exports = {
	createApplication: createApplication,
	setApplicationAcceptedStatus: setApplicationAcceptedStatus,
	deleteApplication: deleteApplication,
	deleteAttachment: deleteAttachment
};
