'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');


const middleware = require('./lib/console/middleware');
const libSetup = require('./lib/console/setup');
const libApplication = require('./lib/application');
const libSession = require('./lib/console/session');
const libUser = require('./lib/console/user');
const lib2FA = require('./lib/console/2fa');

const {consoleCookieOptions} = require('./lib/cookie');


const router = express.Router();


const publicCache = process.env.NO_CACHE ? 'no-cache' :
	'public, max-age=86400';  // 1 day in seconds
const privateCache = process.env.NO_CACHE ? 'no-cache' :
	'private, max-age=86400';  // 1 day in seconds


router.use('/favicon.ico', express.static(
	path.join(__dirname, '..', 'static', 'img', 'mh-logo.svg'), {
	setHeaders: (res, path, stat) => {
		res.set('Cache-Control', publicCache);
	}
}));
router.use('/manifest.webmanifest', express.static(
	path.join(__dirname, '..', 'static', 'manifest.webmanifest'), {
	setHeaders: (res, path, stat) => {
		res.set('Cache-Control', publicCache);
	}
}));
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(cookieParser());
router.use(middleware.getSession);
router.use(middleware.getUser);


libSetup.init();


router.get('/login', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/login');
});


router.get('/register', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/register');
});


router.get('/setup-otp', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/setup_otp');
});


router.get('/not-connected', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.status(503).render('console/not-connected');
});


router.post('/login', async (req, res) => {
	req.user = await libUser.getUserByUsername(req.body.username);

	if (req.user === 'NO_USER') {
		res.status(400).render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered ' +
				'is correct and try again.'
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
		const sessions = await libSession.getUserSessions(req.user);
		for (const session of sessions) {
			if (Date.now() - session.time > consoleCookieOptions.maxAge) {
				await session.delete();
			}
		}
		req.session = await libSession.createSession(req.user,
			req.get('user-agent'), req.ip);

		res.cookie('CSID', req.session.uuid, consoleCookieOptions);
		res.redirect(303, '/console/');
	}
});


router.post('/register/', async (req, res) => {
	// User is retrieved using CUID cookie

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
				if (!req.user.secret) {
					res.redirect(303, '/console/setup-otp/');
				} else {
					res.clearCookie('CUID', consoleCookieOptions);
					res.render('console/status', {
						title: 'Account created!', info: 'You can log in with your new account now!'
					});
				}
				break;
		}
	}
});


router.post('/setup-otp/', async (req, res) => {
	// User is retrieved using CUID cookie

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
	await libSession.deleteAllUserSessions(req.user);

	res.clearCookie('CSID', consoleCookieOptions);
	res.redirect(303, '/console/login/');
});


router.get('/', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/home');
});


router.get('/desktop', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/desktop');
});


router.get('/applications', async (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/applications');
});


router.get('/application', async (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/application');
});


router.get('/settings', (req, res) => {
	res.set('Cache-Control', privateCache);
	res.render('console/settings');
});


router.get('/feedback', (req, res) => {
	res.set('Cache-Control', privateCache);
	res.render('console/feedback');
});


router.get('/notes', (req, res) => {
	res.set('Cache-Control', privateCache);
	res.render('console/notes');
});


router.get('/versions', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/versions');
});


router.get('/about', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/about');
});


router.get('/help', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/help');
});


router.post('/settings', async (req, res) => {
	if (req.body.password !== req.body.passwordRepeat) {
		res.status(400).render('console/status', {
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
				await libSession.deleteAllUserSessions(req.user);

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
	res.set('Cache-Control', publicCache);
	const application = await libApplication.getApplicationByFilePath(req.params.path);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.path), application.fileName);
	}
});


router.use(middleware.redirectIfNotAdmin);


router.get('/users', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('console/users');
});


router.all('*', (req, res) => {
	res.status(404).render('console/404');
});


module.exports = {
	consoleRouter: router
};
