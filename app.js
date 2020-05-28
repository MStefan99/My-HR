const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const uuid = require('uuid');
const multer = require('multer')
const nodemailer = require('nodemailer');
const util = require('util');
const {consoleRouter} = require('./console');


const app = express();
const upload = multer({dest: 'uploads/'});
const readFile = util.promisify(fs.readFile);


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use('/console', consoleRouter);


async function openDB() {
	const db = await sqlite.open({
		filename: 'database/db.sqlite',
		driver: sqlite3.Database
	});
	await db.run(`pragma foreign_keys = on;`);

	return db;
}


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
		subject: 'Complete your application for [company name]',
		html: html
	});
}


async function redirectIfNotAuthorized(req, res, next) {
	const id = req.query.sessionId || req.cookies.SID;
	if (req.query.sessionId) {
		res.cookie('SID', req.query.sessionId, {httpOnly: true, sameSite: 'strict'});
	}
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	const db = await openDB();
	const session = await db.get(`select *
                                  from sessions
                                  where uuid = $uuid`, {$uuid: id});
	if (!session) {
		res.render('status', {
			title: 'Broken link',
			info: 'The link you\'ve followed isn\'t correct. Please check if you are using the correct link and try again.'
		});
	} else if (session) {
		if (session.ip !== ip) {
			res.render('status', {
				title: 'Wrong IP', info: 'To ensure our data stays safe we\'ve limited who can access this page. ' +
					'As a result, you can only view it from the same IP as when registering on the website. ' +
					'Open the link from that IP or create a new link by returning to the home page. ' +
					'We apologize for the inconvenience.'
			});
		} else {
			req.session = session;
			next();
		}
	} else {
		res.redirect(303, '/');
	}
}


app.get('/', (req, res) => {
	res.render('register');
});


app.post('/register', async (req, res) => {
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


app.get('/registered', (req, res) => {
	res.render('status', {
		title: 'Check your email!', info: 'We have sent you an email with your application link. ' +
			'Please follow it to complete your registration.'
	});
});


app.use(redirectIfNotAuthorized);


app.get('/join', async (req, res) => {
	const db = await openDB();
	const count = (await db.get(`select count(id) as count from applications`)).count;
	res.render('join', {email: req.session.email, mobile_disabled: (count < 10)});
});


app.post('/join', upload.single('cv'), async (req, res) => {
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


app.get('/success', async (req, res) => {
	res.render('status', {
		title: 'Thank you!',
		info: 'We have received your application and will contact you as soon as possible!'
	});
});


http.createServer(app.listen(3001, () => {
	console.log('Listening on http://localhost:3001');
}));
