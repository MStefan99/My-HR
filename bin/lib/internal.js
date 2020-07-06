'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const openDB = require('./db');

const router = express.Router();


router.use(bodyParser.text());


router.post('/bounce', async (req, res) => {
	const message = JSON.parse(JSON.parse(req.body).Message);
	const email = message.mail.destination[0];

	const db = await openDB();
	await db.run(`insert into mail(address)
                  values ($email)
                  on conflict do nothing`, {$email: email});
	console.log(`Email to ${email} has bounced.`);
	res.sendStatus(200);
});


router.post('/complain', (req, res) => {
	const message = JSON.parse(JSON.parse(req.body).Message);
	const email = message.mail.destination[0];

	console.log(`Email to ${email} has received a complaint.`);
	res.sendStatus(200);
});


module.exports = {
	internalRouter: router
}
