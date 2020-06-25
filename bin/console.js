const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const uuid = require('uuid');
const twoFactor = require('node-2fa');

const sendMail = require('./lib/mail');
const openDB = require('./lib/db');
const middleware = require('./lib/console/middleware');
const libApplication = require('./lib/application');
const libSetup = require('./lib/console/setup');
const libSession = require('./lib/console/session');
const libUser = require('./lib/console/user');
const lib2FA = require('./lib/console/2fa');


const router = express.Router();

const cookieOptions = {
	httpOnly: true,
	sameSite: 'strict',
	maxAge: 24 * 60 * 60 * 1000  // 1 day in milliseconds
};
const publicCache = process.env.NO_CACHE? 'no-cache' : 'public, max-age=86400';  // 1 day in seconds
const privateCache = process.env.NO_CACHE? 'no-cache' :  'private, max-age=86400';  // 1 day in seconds


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
	const secret = lib2FA.generateSecret(req.user);
	res.json(secret);
});


router.post('/login', async (req, res) => {
	if (!req.user) {
		res.render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (!req.user.passwordHash) {
		res.cookie('CUID', req.user.uuid, cookieOptions);
		res.redirect(303, '/console/register/');
	} else if (!await libUser.verifyUserPassword(req.user, req.body.password)) {
		res.render('console/status', {
			title: 'Wrong password', info: 'You have entered the wrong password. ' +
				'Please try again.'
		});
	} else if (!req.user.secret) {
		res.cookie('CUID', req.user.uuid, cookieOptions);
		res.redirect(303, '/console/setup-otp');
	} else if (!lib2FA.verifyOtp(req.user, req.body.otp)) {
		res.render('console/status', {
			title: 'Wrong authenticator code', info: 'Your one-time password ' +
				'is wrong or expired, please try again.'
		});
	} else {
		const session = libSession.createSession(req.user.id,
			req.headers['user-agent'], req.connection.remoteAddress);
		res.cookie('CSID', session.uuid, cookieOptions);
		res.redirect(303, '/console/');
	}
});


router.post('/register/', async (req, res) => {
	if (!req.user) {
		res.render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (req.user.setupCode !== req.body.setupCode) {
		res.render('console/status', {
			title: 'Wrong setup code', info: 'You have entered a wrong setup code. ' +
				'These codes are used as an additional protection against unauthorized users. ' +
				'Please check your setup code and try again. '
		});
	} else if (req.body.password !== req.body.passwordRepeat) {
		res.render('console/status', {
			title: 'Passwords do not match', info: 'Please return to ' +
				'registration and retype your password.'
		});
	} else if (req.body.password.length < 8) {
		res.render('console/status', {
			title: 'Your password is too short', info: 'For security of user info on this site ' +
				'please ensure your password is at least 8 characters long.'
		});
	} else {
		await libUser.updateUserPassword(req.req.user, req.body.password);
		res.cookie('CUID', req.user.uuid, cookieOptions);
		res.redirect(303, '/console/setup-otp');
	}
});


router.post('/setup-otp/', async (req, res) => {
	if (!req.cookies.CUID) {
		res.redirect(303, '/console/');
	} else if (!lib2FA.verifyOtp(req.user, req.body.otp)) {
		res.render('console/status', {
			title: 'Wrong authenticator code', info: 'Your one-time password ' +
				'is wrong or expired, please try again.'
		});
	} else {
		await libUser.updateUserSecret(req.user, req.body.secret);
		res.clearCookie('CUID', cookieOptions);
		res.render('console/status', {
			title: 'Account created!', info: 'You can log in with your new account now!'
		});
	}
});


router.get('/logout', async (req, res) => {
	await libSession.deleteSession(req.session);
	res.clearCookie('CSID', cookieOptions);
	res.redirect(303, '/console/');
});


router.get('/exit', async (req, res) => {
	await libSession.deleteAllUserSessions(req.user);
	res.redirect('/console/login/');
});


router.use(middleware.redirectIfNotAuthorized);


router.get('/', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/home');
});


router.get('/applications', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/applications');
});


router.get('/versions', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/versions');
});


router.get('/get-applications', async (req, res) => {
	const applications = libApplication.getApplicationsByType(req.query.type);
	res.json(applications);
});


router.get('/application', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/application');
});


router.get('/get-application/:id', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.id);
	application.starred = await libApplication.getApplicationStar(application, req.user);
	res.json(application);
});


router.post('/stars', async (req, res) => {
	const db = await openDB();
	await db.run(`insert into console_stars(user_id, application_id)
                  values ($uid, $aid)`,
		{$uid: req.user.id, $aid: req.query.applicationId});
	await db.close();
	res.end();
});


router.delete('/stars', async (req, res) => {
	const db = await openDB();
	await db.run(`delete
                  from console_stars
                  where user_id=$uid
                    and application_id=$aid`,
		{$uid: req.user.id, $aid: req.query.applicationId});
	await db.close();
	res.end();
});


router.post('/applications/accept', async (req, res) => {
	const db = await openDB();
	const application = await db.get(`select first_name as name,
                                             email,
                                             accepted
                                      from applications
                                      where id=$id`, {$id: req.query.id});
	if (!application) {
		res.status(400);
	} else if (application.accepted) {
		res.status(400);
	} else {
		await db.run(`update applications
                      set accepted=1
                      where id=$id`, {$id: req.query.id});
		await db.close();
		await sendMail(application.email,
			'Welcome to Mine Eclipse!',
			'accepted.html',
			{name: application.name});
		res.end();
	}
});


router.post('/applications/reject', async (req, res) => {
	const db = await openDB();
	const application = await db.get(`select first_name as name,
                                             email,
                                             accepted
                                      from applications
                                      where id=$id`, {$id: req.query.id});
	if (!application) {
		res.status(400);
	} else if (application.accepted) {
		res.status(400);
	} else {
		await db.run(`update applications
                      set accepted= -1
                      where id=$id`, {$id: req.query.id});
		await db.close();
		await sendMail(application.email,
			'Your Mine Eclipse application',
			'rejected.html',
			{name: application.name});
		res.end();
	}
});


router.get('/settings', (req, res) => {
	res.set('Cache-control', privateCache);
	res.render('console/settings', {user: req.user});
});


router.get('/sessions', async (req, res) => {
	const db = await openDB();
	const sessions = await db.all(`select ip, ua, time
                                   from console_sessions
                                   where user_id=$id
                                   order by time desc`, {$id: req.user.id});
	await db.close();
	res.json(sessions);
});


router.post('/settings', async (req, res) => {
	const db = await openDB();

	if (req.body.password !== req.body.passwordRepeat) {
		await db.close();
		res.render('console/status', {
			title: 'Passwords do not match', info: 'Please return to ' +
				'settings page and retype your password.'
		});
	} else if (req.body.password.length < 8) {
		await db.close();
		res.render('console/status', {
			title: 'Your password is too short', info: 'For security of user info on this site ' +
				'please ensure your password is at least 8 characters long.'
		});
	} else {
		const hash = crypto.createHmac('sha512', hashSecret);
		hash.update(req.body.password);
		await db.run(`update console_users
                      set password_hash=$hash
                      where id=$id`, {
			$id: req.user.id,
			$hash: hash.digest('hex'),
		});
		await logOut(req.user.id);
		await db.close();
		res.clearCookie('CSID', cookieOptions);
		res.render('console/status', {
			title: 'Success', info: 'You can log in with your new password now. ' +
				'Note that you have been logged out on all devices.'
		});
	}
});


router.get('/file/:name', async (req, res) => {
	res.set('Cache-control', publicCache);
	const db = await openDB();
	const file = await db.get(`select file_name as fileName,
                                      file_path as filePath
                               from applications
                               where file_path=$path`,
		{$path: req.params.name});
	await db.close();
	if (file) {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.name), file.fileName);
	} else {
		res.status(404).end();
	}
});


router.use(middleware.redirectIfNotAdmin);


router.get('/users', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/users');
});


router.delete('/users', async (req, res) => {
	if (req.query.username !== 'admin') {
		const db = await openDB();
		await db.run(`delete
                      from console_users
                      where username=$username`, {$username: req.query.username});
		await db.close();
		res.end();
	} else {
		res.status(400).end();
	}
});


router.post('/users', async (req, res) => {
	const db = await openDB();
	await db.run(`insert into console_users(username, admin, uuid, setup_code)
                  values ($username, $admin, $id, $code)`, {
		$username: req.query.username,
		$admin: req.query.admin ? 1 : 0,
		$id: uuid.v4(),
		$code: uuid.v4()
	}).catch(() => {
		res.status(422);
	});
	await db.close();
	res.end();
});


router.get('/get-users', async (req, res) => {
	const db = await openDB();
	const users = await db.all(`select username,
                                       admin,
                                       setup_code as setupCode,
                                       case
                                           when secret is null
                                               then 0
                                           else 1
                                           end
                                                  as otpSetup
                                from console_users`);
	await db.close();
	res.json(users);
});


router.use((req, res, next) => {
	res.status(404).render('console/404');
});


module.exports = {
	consoleRouter: router
};
