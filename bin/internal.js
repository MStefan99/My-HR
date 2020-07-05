'use strict';

const express = require('express');
const bodyParser = require('body-parser');


const router = express.Router();


router.use(bodyParser.text());


router.post('/bounce', (req, res) => {
	const message = JSON.parse(JSON.parse(req.body).Message);
	const email = message.mail.destination[0];

	console.log(`Email to ${email} has bounced.`);
	//TODO: handle bounced messages (important)
	res.end();
});


router.post('/complain', (req, res) => {
	const message = JSON.parse(JSON.parse(req.body).Message);
	const email = message.mail.destination[0];

	console.log(`Email to ${email} has received a complaint.`);
	//TODO: handle complaints (probably not needed)
	res.end();
});


module.exports = {
	internalRouter: router
}
