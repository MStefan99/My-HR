'use strict';

const libApplication = require('../../lib/application');
const openDB = require('../../lib/db');
const fs = require('fs');
const path = require('path');
const util = require('util');


const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);


async function createApplicationWithFile(session, applicationData) {
	const location = path.join(__dirname, '..', '..', '..', 'uploads', applicationData.filePath);
	await writeFile(location, 'test file used in testing');
	return await libApplication.createApplication(session, applicationData);
}


async function setApplicationAcceptedStatus(application, status) {
	if (application) {
		const db = await openDB();
		await db.run(`update applications
                      set accepted=$accepted
                      where id=$id`,
			{$accepted: status, $id: application.id});
		await db.close();
		application.accepted = status;
	}
}


async function deleteApplicationWithFile(application) {
	if (application) {
		const db = await openDB();

		const location = path.join(__dirname, '..', '..', '..', 'uploads', application.filePath);
		await unlink(location).catch(() => {
		});
		await db.run(`delete
                      from applications
                      where id=$id`, {$id: application.id});
		await db.close();
	}
}


async function deleteApplicationWithFilePath(filePath) {
	const db = await openDB();

	await db.run(`delete
                  from applications
                  where file_path=$fp`, {$fp: filePath});
	await db.close();
}


module.exports = {
	createApplicationWithFile: createApplicationWithFile,
	setApplicationAcceptedStatus: setApplicationAcceptedStatus,
	deleteApplicationWithFile: deleteApplicationWithFile,
	deleteApplicationWithFilePath: deleteApplicationWithFilePath
};
