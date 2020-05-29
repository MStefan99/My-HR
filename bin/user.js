const express = require('express');
const fs = require('fs');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const uuid = require('uuid');
const multer = require('multer')
const nodemailer = require('nodemailer');
const util = require('util');
const openDB = require('./db');


const router = express.Router();
const upload = multer({dest: 'uploads/'});
const readFile = util.promisify(fs.readFile);
const cookieOptions = {httpOnly: true, sameSite: 'strict'};


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


async function sendMail(email, params) {
	const template = await readFile('mail_template.html', 'utf8');

	const html = template.replace(/%{(.*?)}/g, (match, g1) => params[g1]);
	const transporter = nodemailer.createTransport({
		host: "mail.inet.fi",
		port: 25,
		secure: false,
	});

	await transporter.sendMail({
		from: 'noreply@mstefan99.com',
		to: email,
		subject: 'Complete your routerlication for [company name]',
		html: html
	});
}


async function redirectIfNotAuthorized(req, res, next) {
	const id = req.query.sessionId || req.cookies.SID;
	if (req.query.sessionId) {
		res.cookie('SID', req.query.sessionId, cookieOptions);
	}
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	const db = await openDB();
	const session = await db.get(`select uuid,
                                         email,
                                         ip,
                                         created_at as createdAt
                                  from sessions
                                  where uuid = $uuid`, {$uuid: id});
	if (!session) {
		res.render('user/status', {
			title: 'Broken link',
			info: 'The link you\'ve followed isn\'t correct. Please check if you are using the correct link and try again.'
		});
	} else if (session) {
		if (session.ip !== ip) {
			res.render('user/status', {
				title: 'Wrong IP', info: 'To ensure our data stays safe we\'ve limited who can access this page. ' +
					'As a result, you can only view it from the same IP as when registering on the website. ' +
					'Open the link from that IP or create a new link by returning to the home page. ' +
					'We apologize for the inconvenience.'
			});
		} else if (Date.now() - session.createdAt > 1800000) {
			res.render('user/status', {
				title: 'Session expired', info: 'To ensure our data stays safe we\'ve limited the session time. ' +
					'Your session is now expired, meaning you need to return to the home page and get the new link ' +
					'to continue using the website. We apologize for the inconvenience.'
			});
		} else {
			req.session = session;
			next();
		}
	} else {
		res.redirect(303, '/');
	}
}


router.get('/', (req, res) => {
	res.render('user/register');
});


router.post('/register', async (req, res) => {
	const email = req.body.username + '@metropolia.fi';
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	const id = uuid.v4();

	const db = await openDB();
	await db.run(`insert into sessions(uuid, email, ip, created_at)
                  values ($uuid, $email, $ip, $time)`,
		{$uuid: id, $email: email, $ip: ip, $time: Date.now()});
	await sendMail(email, {sid: id});
	res.redirect(303, '/registered/');
});


router.get('/registered', (req, res) => {
	res.render('user/status', {
		title: 'Check your email!', info: 'We have sent you an email with your routerlication link. ' +
			'Please follow it to complete your registration.'
	});
});


router.use(redirectIfNotAuthorized);


router.get('/join', async (req, res) => {
	const db = await openDB();
	const count = (await db.get(`select count(id) as count
                                 from applications`)).count;
	res.render('user/join', {email: req.session.email, mobile_disabled: (count < 10)});
});


router.post('/join', upload.single('cv'), async (req, res) => {
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
		$fn: req.body.firstName,
		$ln: req.body.lastName,
		$email: req.session.email,
		$be: req.body.backupEmail,
		$phone: req.body.phone,
		$bp: req.body.backupPhone,
		$team: req.body.team,
		$links: req.body.links,
		$ff: req.body.freeForm,
		$fln: req.file.originalname,
		$flp: req.file.filename
	});  // TODO: handle exceptions
	res.redirect(303, '/success/');
});


router.get('/success', async (req, res) => {
	res.render('user/status', {
		title: 'Thank you!',
		info: 'We have received your routerlication and will contact you as soon as possible!'
	});
});


module.exports = {
	applicationRouter: router
}