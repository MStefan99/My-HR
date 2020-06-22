const fs = require('fs');
const util = require('util');
const path = require('path');
const nodemailer = require('nodemailer');


const readFile = util.promisify(fs.readFile);


async function sendMail(email, subject, template, params={}) {
	const text = await readFile(path.join(__dirname, 'mail_templates', template), 'utf8');

	const html = text.replace(/%{(.*?)}/g, (match, g1) => params[g1]);
	const transporter = nodemailer.createTransport({
		host: 'mail.inet.fi',
		port: 25,
		secure: false,
		tls: {
			rejectUnauthorized: false
		}
	});

	await transporter.sendMail({
		from: 'noreply@mstefan99.com',
		to: email,
		subject: subject,
		html: html
	});
}


module.exports = sendMail
