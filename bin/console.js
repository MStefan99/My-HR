'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const sendMail = require('./lib/mail');
const middleware = require('./lib/console/middleware');
const libApplication = require('./lib/application');
const libSetup = require('./lib/console/setup');
const libSession = require('./lib/console/session');
const libUser = require('./lib/console/user');
const lib2FA = require('./lib/console/2fa');
const {consoleCookieOptions} = require('./lib/cookie');


const router = express.Router();


const publicCache = process.env.NO_CACHE ? 'no-cache' :
	'public, max-age=86400';  // 1 day in seconds
const privateCache = process.env.NO_CACHE ? 'no-cache' :
	'private, max-age=86400';  // 1 day in seconds


router.use('/favicon.ico', express.static(path.join(__dirname, '..', 'static', 'img', 'mh-logo.svg'), {
	setHeaders: (res, path, stat) => {
		res.set('Cache-control', publicCache);
	}
}));
router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(middleware.getSession);
router.use(middleware.getUser);


libSetup.init();


router.get('/login', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/login');
});


router.get('/register', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/register');
});


router.get('/setup-otp', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/setup_otp');
});


router.get('/get-otp', async (req, res) => {
	if (req.user === 'NO_USER') {
		res.redirect(303, '/console/login/');
	} else {
		res.json(lib2FA.generateSecret(req.user));
	}
});


router.post('/login', async (req, res) => {
	req.user = await libUser.getUserByUsername(req.body.username);

	if (req.user === 'NO_USER') {
		res.status(400).render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (!req.user.passwordHash) {
		res.cookie('CUID', req.user.uuid, consoleCookieOptions);
		res.redirect(303, '/console/register/?username=' + req.user.username);
	} else if (!req.user.verifyPassword(req.body.password)) {
		res.status(403).render('console/status', {
			title: 'Wrong password', info: 'You have entered the wrong password. ' +
				'Please try again.'
		});
	} else if (!req.user.secret) {
		res.cookie('CUID', req.user.uuid, consoleCookieOptions);
		res.redirect(303, '/console/setup-otp/');
	} else if (!lib2FA.verifyOtp(req.user.secret, req.body.token)) {
		res.status(403).render('console/status', {
			title: 'Wrong authenticator code', info: 'Your one-time password ' +
				'is wrong or expired, please try again.'
		});
	} else {
		const sessions = await req.user.getSessions();
		for (const session of sessions) {
			if (Date.now() - session.time > consoleCookieOptions.maxAge) {
				await session.delete();
			}
		}
		req.session = await libSession.createSession(req.user,
			req.headers['user-agent'], req.connection.remoteAddress);

		res.cookie('CSID', req.session.uuid, consoleCookieOptions);
		res.redirect(303, '/console/');
	}
});


router.post('/register/', async (req, res) => {
	if (req.user === 'NO_USER') {
		res.redirect(303, '/console/login/');
	} else if (req.user.setupCode !== req.body.setupCode) {
		res.status(403).render('console/status', {
			title: 'Wrong setup code', info: 'You have entered a wrong setup code. ' +
				'These codes are used as an additional protection against unauthorized users. ' +
				'Please check your setup code and try again. '
		});
	} else if (req.body.password !== req.body.passwordRepeat) {
		res.status(400).render('console/status', {
			title: 'Passwords do not match', info: 'Please return to ' +
				'registration and retype your password.'
		});
	} else {
		switch (await req.user.updatePassword(req.body.password)) {
			case 'NO_PASSWORD':
				res.status(400).render('console/status', {
					title: 'No password', info: 'You have entered an empty password. Please ' +
						'return and select a valid password.'
				});
				break;
			case 'TOO_SHORT':
				res.status(400).render('console/status', {
					title: 'Your password is too short', info: 'For security of user info on this site ' +
						'please ensure your password is at least 8 characters long.'
				});
				break;
			case 'OK':
				res.redirect(303, '/console/setup-otp/');
				break;
		}
	}
});


router.post('/setup-otp/', async (req, res) => {
	if (req.user === 'NO_USER') {
		res.redirect(303, '/console/login/');
	} else if (!lib2FA.verifyOtp(req.body.secret, req.body.token)) {
		res.status(403).render('console/status', {
			title: 'Wrong authenticator code', info: 'Your one-time password ' +
				'is wrong or expired, please try again.'
		});
	} else {
		await req.user.setSecret(req.body.secret);

		res.clearCookie('CUID', consoleCookieOptions);
		res.render('console/status', {
			title: 'Account created!', info: 'You can log in with your new account now!'
		});
	}
});


router.use(middleware.redirectIfNotAuthorized);


router.get('/logout', async (req, res) => {
	await req.session.delete();

	res.clearCookie('CSID', consoleCookieOptions);
	res.redirect(303, '/console/');
});


router.get('/exit', async (req, res) => {
	await req.user.deleteAllSessions();

	res.clearCookie('CSID', consoleCookieOptions);
	res.redirect('/console/login/');
});


router.get('/', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/home');
});


router.get('/desktop', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/desktop');
});


router.get('/applications', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/applications');
});


router.get('/application', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/application');
});


router.get('/settings', (req, res) => {
	res.set('Cache-control', privateCache);
	res.render('console/settings', {user: req.user});
});


router.get('/versions', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/versions');
});


router.get('/about', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/about');
});


router.get('/help', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/help');
});


router.get('/get-applications', async (req, res) => {
	let applications;
	if (req.query.type === 'stars') {
		applications = await req.user.getStarredApplications();
	} else {
		applications = await libApplication.getApplicationsByType(req.query.type);
	}

	res.json(applications);
});


router.get('/get-application/:applicationID', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		application.starred = await req.user.hasStarredApplication(application);

		res.json(application);
	}
});


router.post('/stars', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.query.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (await req.user.starApplication(application)) {
			case 'ALREADY_STARRED':
				res.status(400).send('ALREADY_STARRED');
				break;
			case 'OK':
				res.send('OK');
				break;
		}
	}
});


router.delete('/stars', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.query.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (await req.user.unstarApplication(application)) {
			case 'NOT_STARRED':
				res.status(400).send('NOT_STARRED');
				break;
			case 'OK':
				res.send('OK');
				break;
		}
	}
});


router.post('/applications/accept', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.query.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (await application.accept()) {
			case 'ALREADY_ACCEPTED':
				res.status(400).send('ALREADY_ACCEPTED');
				break;
			case 'ALREADY_REJECTED':
				res.status(400).send('ALREADY_REJECTED');
				break;
			case 'OK':
				await sendMail(application.email,
					'Welcome to Mine Eclipse!',
					'accepted.html',
					{name: application.firstName});

				res.send('OK');
				break;
		}
	}
});


router.post('/applications/reject', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.query.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (await application.reject()) {
			case 'ALREADY_ACCEPTED':
				res.status(400).send('ALREADY_ACCEPTED');
				break;
			case 'ALREADY_REJECTED':
				res.status(400).send('ALREADY_REJECTED');
				break;
			case 'OK':
				await sendMail(application.email,
					'Your Mine Eclipse application',
					'rejected.html',
					{name: application.firstName});

				res.send('OK');
				break;
		}
	}
});


router.get('/sessions', async (req, res) => {
	const sessions = await req.user.getSessions();

	res.json(sessions);
});


router.post('/settings', async (req, res) => {
	if (req.body.password !== req.body.passwordRepeat) {
		res.render('console/status', {
			title: 'Passwords do not match', info: 'Please return to ' +
				'settings page and retype your password.'
		});
	} else {
		switch (await req.user.updatePassword(req.body.password)) {
			case 'NO_PASSWORD':
				res.status(400).render('console/status', {
					title: 'No password', info: 'You have entered an empty password. Please ' +
						'return and select a valid password.'
				});
				break;
			case 'TOO_SHORT':
				res.status(400).render('console/status', {
					title: 'Your password is too short', info: 'For security of user info on this site ' +
						'please ensure your password is at least 8 characters long.'
				});
				break;
			case 'OK':
				await req.user.deleteAllSessions();

				res.clearCookie('CSID', consoleCookieOptions);
				res.render('console/status', {
					title: 'Success', info: 'You can log in with your new password now. ' +
						'Note that you have been logged out on all devices.'
				});
				break;
		}
	}
});


router.get('/file/:path', async (req, res) => {
	res.set('Cache-control', publicCache);
	const application = await libApplication.getApplicationByFilePath(req.params.path);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.path), application.fileName);
	}
});


router.use(middleware.redirectIfNotAdmin);


router.get('/users', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/users');
});


router.delete('/users', async (req, res) => {
	const user = await libUser.getUserByUsername(req.query.username);

	switch (await user.delete()) {
		case 'CANNOT_DELETE_ADMIN':
			res.status(403).send('CANNOT_DELETE_ADMIN');
			break;
		case 'OK':
			res.send('OK');
			break;
	}
});


router.post('/users', async (req, res) => {
	switch (await libUser.createUser(req.query.username,
		req.query.admin === 'true')) {
		case 'DUPLICATE_USERNAME':
			res.status(400).send('DUPLICATE_USERNAME');
			break;
		default:
			res.send('OK');
			break;
	}
});


router.get('/get-users', async (req, res) => {
	const users = await libUser.getAllUsers();

	for (const user of users) {
		user.otpSetup = !!user.secret;
		delete user.passwordHash;
	}
	res.json(users);
});


router.use((req, res, next) => {
	res.status(404).render('console/404');
});


module.exports = {
	consoleRouter: router
};
