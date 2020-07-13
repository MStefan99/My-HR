'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const nodemailer = require('nodemailer');


const openDB = require('./db');
const readFile = util.promisify(fs.readFile);


async function sendMail(email, subject, template, params = {}) {
	const db = await openDB();
	const invalid = await db.get(`select 1
                            from mail
                            where address=$email`, {$email: email});

	if (!process.env.NO_MAIL && !invalid) {
		const text = await readFile(path.join(__dirname, '..', 'mail_templates', template), 'utf8');

		const html = text.replace(/%{(.*?)}/g, (match, g1) => params[g1]);
		const transporter = nodemailer.createTransport({
			host: 'email-smtp.eu-central-1.amazonaws.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.SMTP_USERNAME,
				pass: process.env.SMTP_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: 'hr@mineeclipse.com',
			to: email,
			subject: subject,
			html: html
		});
	}
}


module.exports = sendMail;
