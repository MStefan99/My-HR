const express = require('express');
const fs = require('fs');
const path = require('path')
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
	const template = await readFile(path.join(__dirname, 'mail_template.html'), 'utf8');

	const html = template.replace(/%{(.*?)}/g, (match, g1) => params[g1]);
	const transporter = nodemailer.createTransport({
		host: "mail.inet.fi",
		port: 25,
		secure: false,
	});

	await transporter.sendMail({
		from: 'noreply@mstefan99.com',
		to: email.trim(),
		subject: 'Complete your application for Mine Eclipse',
		html: html
	});
}


async function createTables() {
	const db = await openDB();
	const tables = await db.all(`select *
                                 from sqlite_master
                                 where type='table'`);
	if (!tables.find(table => table.name === 'sessions')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'sessions.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'applications')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'applications.sql'), 'utf-8'));
	}
}


createTables();


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
                                  where uuid=$uuid`, {$uuid: id});
	if (!session) {
		res.render('user/status', {
			title: 'No link',
			info: 'To ensure our data stays safe we\'ve limited who can access this page. To continue, please ' +
				'return to the home page and get a link by filling in a form. We apologize for the inconvenience.'
		});
	} else {
		if (session.ip !== ip) {
			res.render('user/status', {
				title: 'Wrong address', info: 'To ensure our data stays safe we\'ve limited who can access this page. ' +
					'As a result, you can only view it from the same address as when you had while ' +
					'getting your link on the home page. Open the link from that address or create a new link by ' +
					'returning to the home page. We apologize for the inconvenience.'
			});
		} else {
			req.session = session;
			next();
		}
	}
}


async function redirectIfExpired(req, res, next) {
	if (Date.now() - req.session.createdAt > 1800000) {
		res.render('user/status', {
			title: 'Link expired', info: 'To ensure our data stays safe we\'ve limited the time during which ' +
				'links are valid. Your one has now expired, meaning you need to return to the home page ' +
				'and get the new link to continue using the website. We apologize for the inconvenience.'
		});
	} else {
		next();
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
		title: 'Check your email', info: 'We\'ve sent you an email with your link! ' +
			'Please follow it to complete your application.'
	});
});


router.use(redirectIfNotAuthorized);


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
		title: 'Thank you',
		info: 'We have received your application and will contact you as soon as possible.'
	});
});


router.use(redirectIfExpired)


router.get('/join', async (req, res) => {
	const db = await openDB();
	const count = (await db.get(`select count(id) as count
                                 from applications`)).count;
	res.render('user/join', {email: req.session.email, mobile_disabled: (count < 15)});
});


router.use((req, res, next) => {
	res.status(404).render('user/404');
});


module.exports = {
	applicationRouter: router
}
