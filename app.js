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


const app = express();
const upload = multer({dest: 'files/'});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


async function openDB() {
	const db = await sqlite.open({
		filename: 'database/db.sqlite',
		driver: sqlite3.Database
	});
	await db.run(`pragma foreign_keys = on;`);

	return db;
}


async function sendMail() {

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

	const db = await openDB();
	await db.run(`insert into sessions(uuid, email, ip, created_at)
                  values ($uuid, $email, $ip, $time)`,
		{$uuid: uuid.v4(), $email: email, $ip: ip, $time: Date.now()});
	await sendMail();
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
	res.render('join', {email: req.session.email});
});


app.post('/join', async (req, res) => {
	const db = await openDB();
	await db.run(`insert into applications(first_name, last_name, email, backup_email, phone, team, file)
                  values ($fn, $ln, $email, $be, $phone, $team, $file)`, {
		$fn: req.body.firstName,
		$ln: req.body.lastName,
		$email: req.session.email,
		$be: req.body.backupEmail,
		$phone: req.body.phone,
		$team: req.body.team,
		$file: 'test'
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
