const openDB = require('../lib/db');
const sendMail = require('../lib/mail');


function sleep(ms) {
	return new Promise((resolve => {
		setTimeout(resolve, ms);
	}));
}


(async () => {
	console.log('Starting to send emails...');

	const db = await openDB();
	const applications = await db.all(`select first_name as firstName,
                                              last_name  as lastName,
                                              email
                                       from applications
                                       where accepted=0`);

	for (const application of applications) {
		await sendMail(application.email,
			'Your Mine Eclipse application',
			'rejected.html',
			{name: application.firstName});
		console.log(`Email to ${application.firstName} ${application.lastName}` +
			` (${application.email}) sent.`);
		await sleep(200);
	}

	await db.run(`update applications
                  set accepted= -2
                  where accepted=0`);
	await db.close();

	console.log('All emails sent, database updated.');
})()
