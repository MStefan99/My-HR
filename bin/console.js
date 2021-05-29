'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const middleware = require('./lib/console/middleware');
const flash = require('express-flash');
const rateLimiter = require('rate-limiter');
const libSetup = require('./lib/console/setup');
const libApplication = require('./lib/application');
const libSession = require('./lib/console/session');
const lib2FA = require('./lib/console/2fa');
const QRCode = require('qrcode');

const {consoleCookieOptions} = require('./lib/cookie');


const router = express.Router();


const publicCache = process.env.NO_CACHE ? 'no-cache' :
	'public, max-age=86400';  // 1 day in seconds


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
router.use(flash());
router.use(middleware.getSession());
router.use(middleware.getUser());


libSetup.init();


router.get('/login', (req, res) => {
	res.clearCookie('CUID', consoleCookieOptions);
	res.render('console/login');
});


router.get('/register', (req, res) => {
	res.render('console/register');
});


router.get('/setup-otp', async (req, res) => {
	if (req.user === 'NO_USER') {
		res.redirect(303, '/console/login/');
	} else {
		const secret = lib2FA.generateSecret(req.user);

		res.render('console/setup_otp', {
			secret: secret,
			qrData: await QRCode.toDataURL(
				decodeURIComponent(secret.uri))
		});
	}
});


router.get('/not-connected', (req, res) => {
	res.status(503).render('console/not-connected');
});


router.post('/login', rateLimiter({
	scheme: 'user.id',
	tag: 'auth',
	price: 5,
	redirect: true,
	action: (req, res) => res.flash({
		type: 'warning',
		title: 'Too many attempts',
		info: 'We have detected too many sign in attempts for your IP. ' +
			'Please try again after some time.'
	})
}), async (req, res) => {
	// User is retrieved by username

	if (req.user === 'NO_USER') {
		res.flash({
			type: 'error',
			title: 'No such user',
			info: 'Please check if the username you entered ' +
				'is correct and try again'
		}).redirect(303, '/console/login/');
	} else if (!req.user.passwordHash) {
		res.cookie('CUID', req.user.uuid, consoleCookieOptions)
			.flash({
				title: 'Sign up for My HR',
				info: 'To use My HR, please create your password here'
			}).redirect(303, '/console/register/?username=' + req.user.username);
	} else if (!req.user.verifyPassword(req.body.password)) {
		res.flash({
			type: 'error',
			title: 'Wrong password',
			info: 'You have entered the wrong password. Please try again'
		}).redirect(303, '/console/login/');
	} else if (!req.user.secret) {
		res.cookie('CUID', req.user.uuid, consoleCookieOptions)
			.flash({
				title: 'Set up 2FA',
				info: 'Set up 2FA to start using My HR'
			}).redirect(303, '/console/setup-otp/');
	} else if (!lib2FA.verifyOtp(req.user.secret, req.body.token)) {
		res.flash({
			type: 'error',
			title: 'Wrong authenticator code',
			info: 'Your one-time password is wrong or expired, please try again'
		}).redirect(303, '/console/login/');
	} else {
		const sessions = await libSession.getUserSessions(req.user);
		for (const session of sessions) {
			if (Date.now() - session.time > consoleCookieOptions.maxAge) {
				await session.delete();
			}
		}
		req.session = await libSession.createSession(req.user,
			req.get('user-agent'), req.ip);

		res.cookie('CSID', req.session.uuid, consoleCookieOptions)
			.flash({
				title: 'Hello',
				info: 'Welcome back!'
			}).redirect(303, '/console/');
	}
});


router.post('/register/', async (req, res) => {
	// User is retrieved using CUID cookie

	if (req.user === 'NO_USER') {
		res.redirect(303, '/console/login/');
	} else if (req.user.setupCode !== req.body.setupCode) {
		res.flash({
			type: 'error',
			title: 'Wrong setup code',
			info: 'You have entered a wrong setup code. ' +
				'These codes are used as an additional protection against unauthorized users. ' +
				'Please check your setup code and try again. '
		}).redirect(303, '/console/register/');
	} else if (req.body.password !== req.body.passwordRepeat) {
		res.flash({
			type: 'error',
			title: 'Passwords do not match',
			info: 'Be careful when typing your passwords. Please try again'
		}).redirect(303, '/console/register');
	} else {
		switch (await req.user.updatePassword(req.body.password)) {
			case 'NO_PASSWORD':
				res.flash({
					type: 'error',
					title: 'No password',
					info: 'You have entered an empty password'
				}).redirect(303, '/console/register/');
				break;
			case 'TOO_SHORT':
				res.flash({
					type: 'error',
					title: 'Your password is too short',
					info: 'For best security please ensure ' +
						'your password is at least 8 characters long'
				}).redirect(303, '/console/register/');
				break;
			case 'OK':
				if (!req.user.secret) {
					res.flash({
						title: 'Set up 2FA',
						info: 'Set up 2FA to start using My HR'
					}).redirect(303, '/console/setup-otp/');
				} else {
					res.clearCookie('CUID', consoleCookieOptions)
						.flash({
							title: 'Account created',
							info: 'You can log in with your new account now!'
						}).redirect(303, '/console/login/');
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
		req.flash({
			type: 'error',
			title: 'Wrong authenticator code',
			info: 'Your one-time password is wrong or expired, please try again'
		}).redirect(303, '/console/setup-otp/');
	} else {
		await req.user.setSecret(req.body.secret);

		res.clearCookie('CUID', consoleCookieOptions)
			.flash({
				title: 'Account created!',
				info: 'You can log in with your new account now!'
			}).redirect(303, '/console/login/');
	}
});


router.use(middleware.redirectIfNotAuthorized());


router.get('/logout', async (req, res) => {
	await req.session.delete();

	res.clearCookie('CSID', consoleCookieOptions)
		.flash({
			title: 'Signed out',
			info: 'You have been signed out'
		}).redirect(303, '/console/login/');
});


router.get('/exit', async (req, res) => {
	await libSession.deleteAllUserSessions(req.user);

	res.clearCookie('CSID', consoleCookieOptions)
		.flash({
			title: 'Signed out',
			info: 'You have been signed out on all devices'
		}).redirect(303, '/console/login/');
});


router.get('/', (req, res) => {
	res.render('console/home');
});


router.get('/desktop', (req, res) => {
	res.render('console/desktop');
});


router.get('/applications', async (req, res) => {
	res.render('console/applications');
});


router.get('/application', async (req, res) => {
	res.render('console/application');
});


router.get('/settings', (req, res) => {
	res.render('console/settings');
});


router.get('/feedback', (req, res) => {
	res.render('console/feedback');
});


router.get('/notes', (req, res) => {
	res.render('console/notes');
});


router.get('/versions', (req, res) => {
	res.render('console/versions');
});


router.get('/about', (req, res) => {
	res.render('console/about');
});


router.get('/help', (req, res) => {
	res.render('console/help');
});


router.post('/settings',  rateLimiter({
	scheme: 'user.id',
	tag: 'api-auth',
	price: 10,
	redirect: true,
	action: (req, res) => res.flash({
		type: 'warning',
		title: 'Too many attempts',
		info: 'We have detected too many attempts for your account. ' +
			'Please try again after some time.'
	})
}),  async (req, res) => {
	if (req.body.password !== req.body.passwordRepeat) {
		res.flash({
			type: 'error',
			title: 'Passwords do not match',
			info: 'Be careful when typing your passwords. Please try again'
		}).redirect(303, '/console/settings/');
	} else {
		switch (await req.user.updatePassword(req.body.password)) {
			case 'NO_PASSWORD':
				res.flash({
					type: 'error',
					title: 'No password',
					info: 'You have entered an empty password'
				}).redirect(303, '/console/settings/');
				break;
			case 'TOO_SHORT':
				res.flash({
					type: 'error',
					title: 'Your password is too short',
					info: 'For best security please ensure ' +
						'your password is at least 8 characters long'
				}).redirect(303, '/console/settings/');
				break;
			case 'OK':
				await libSession.deleteAllUserSessions(req.user);

				res.clearCookie('CSID', consoleCookieOptions)
					.flash({
						title: 'Success',
						info: 'You can log in with your new password now! ' +
							'You have been logged out on all devices'
					}).redirect(303, '/console/login/');
				break;
		}
	}
});


router.get('/file/:path', async (req, res) => {
	const application = await libApplication.getApplicationByFilePath(req.params.path);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.path), application.fileName);
	}
});



router.get('/view_file/:path', async (req, res) => {
	const application = await libApplication.getApplicationByFilePath(req.params.path);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		res.type(application.fileName.replace(/.*\./, ''));
		res.sendFile(path.join(__dirname, '..', '/uploads/', req.params.path));
	}
});


router.use(middleware.redirectIfNotAdmin());


router.get('/users', (req, res) => {
	res.render('console/users');
});


router.all('*', (req, res) => {
	res.status(404).render('console/404');
});


module.exports = {
	consoleRouter: router
};
