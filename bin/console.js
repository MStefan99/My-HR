const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const uuid = require('uuid');
const twoFactor = require('node-2fa');
const openDB = require('./db');


const router = express.Router();
const cookieOptions = {httpOnly: true, sameSite: 'strict'};
const hashSecret = 'Your HR secret key'


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(getUser)


async function getUser(req, res, next) {
	if (req.cookies.CSID) {
		const db = await openDB();
		req.user = await db.get(`select username,
                                        password_hash as passwordHash,
                                        cu.uuid       as userId,
                                        cs.uuid       as sessionId,
                                        setup_code,
                                        admin,
                                        secret
                                 from console_sessions cs
                                          left join console_users cu on cs.user_id=cu.id
                                 where cs.uuid=$sid`, {$sid: req.cookies.CSID})
	}
	next();
}


async function redirectIfNotAdmin(req, res, next) {
	if (!req.user) {
		res.redirect(303, '/console/login/');
	} else if (!req.user.passwordHash) {
		res.redirect(303, '/console/register/');
	} else if (!req.user.secret) {
		res.redirect(303, '/console/setup-otp/');
	} else {
		next();
	}
}


router.get('/login', (req, res) => {
	res.render('console/login');
});


router.get('/register', (req, res) => {
	res.render('console/register');
});


router.get('/get-otp', (req, res) => {
	const secret = twoFactor.generateSecret({name: 'My HR'});
	res.json(secret);
});


router.get('/setup-otp', (req, res) => {
	res.render('console/setup_otp');
});


router.post('/login', async (req, res) => {
	const db = await openDB();
	const user = await db.get(`select username,
                                      id,
                                      password_hash as passwordHash,
                                      uuid,
                                      secret
                               from console_users
                               where username=$username`, {$username: req.body.username});
	const hash = crypto.createHmac('sha512', hashSecret);
	hash.update(req.body.password);

	if (!user) {
		res.render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (!user.passwordHash) {
		res.redirect(303, '/console/register/');
	} else if (user.passwordHash !== hash.digest('hex')) {
		res.render('console/status', {
			title: 'Wrong password', info: 'You have entered the wrong password. ' +
				'Please try again.'
		});
	} else if (!user.secret) {
		res.cookie('CUID', user.uuid, cookieOptions);
		res.redirect(303, '/console/setup-otp');
	} else if (twoFactor.verifyToken(user.secret, req.body.otp) ?
		twoFactor.verifyToken(user.secret, req.body.otp).delta : true) {
		res.render('console/status', {
			title: 'Wrong authenticator code', info: 'Your one-time password ' +
				'is wrong or expired, please try again.'
		});
	} else {
		const id = uuid.v4();
		res.cookie('CSID', id, cookieOptions);
		await db.run(`insert into console_sessions(user_id, uuid, ip, ua, time)
                      values ($uid, $uuid, $ip, $ua, $time)`, {
			$uid: user.id, $uuid: id, $ip: req.connection.remoteAddress,
			$ua: req.headers['user-agent'], $time: Date.now()
		});
		res.redirect(303, '/console/');
	}
});


router.post('/register/', async (req, res) => {
	const db = await openDB();
	const user = await db.get(`select uuid,
                                      username,
                                      setup_code as setupCode
                               from console_users
                               where username=$username`, {$username: req.body.username});

	if (!user) {
		res.render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (user.setupCode !== req.body.setupCode) {
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
		const hash = crypto.createHmac('sha512', hashSecret);
		hash.update(req.body.password);
		await db.run(`update console_users
                      set password_hash=$hash,
                          setup_code=null
                      where setup_code=$code`, {
			$code: req.body.setupCode,
			$hash: hash.digest('hex'),
		});
		res.cookie('CUID', user.uuid, cookieOptions);
		res.redirect(303, '/console/setup-otp');
	}
});


router.post('/setup-otp/', async (req, res) => {
	const db = await openDB();

	if (!req.cookies.CUID) {
		res.redirect(303, '/console/');
	} else if (twoFactor.verifyToken(req.body.secret, req.body.otp) ?
		twoFactor.verifyToken(req.body.secret, req.body.otp).delta : true) {
		console.log(twoFactor.verifyToken(req.body.secret, req.body.otp));
		res.render('console/status', {
			title: 'Wrong authenticator code', info: 'Your one-time password ' +
				'is wrong or expired, please try again.'
		});
	} else {
		await db.run(`update console_users
                      set secret=$secret
                      where uuid=$id`, {$secret: req.body.secret, $id: req.cookies.CUID});
		res.clearCookie('CUID', cookieOptions);
		res.redirect(303, '/console/');
	}
});


router.use(redirectIfNotAdmin);


router.get('/', (req, res) => {
	res.render('console/home');
});


router.get('/applications', async (req, res) => {
	const db = await openDB();
	const applications = await db.all(`select id,
                                              first_name as firstName,
                                              last_name  as lastName,
                                              team,
                                              free_form  as freeForm
                                       from applications`);
	res.json(applications);
});


router.get('/application/:id', async (req, res) => {
	const db = await openDB();
	const application = await db.get(`select id,
                                             first_name   as firstName,
                                             last_name    as lastName,
                                             email,
                                             backup_email as backupEmail,
                                             phone,
                                             backup_phone as backupPhone,
                                             team,
                                             links,
                                             free_form    as freeForm,
                                             file_name    as fileName,
                                             file_path    as filePath
                                      from applications
                                      where id=$id`, {$id: req.params.id});
	res.render('console/application', {application: application});
});


router.get('/settings', (req, res) => {
	res.render('console/settings');
});


router.get('/file/:name', (req, res) => {
	res.download(path.join(__dirname, '..', '/uploads/', req.params.name));
});


router.get('/logout', async (req, res) => {
	const db = await openDB();
	await db.run(`delete
                  from console_sessions
                  where uuid=$sid`, {$sid: req.user.sessionId});
	res.clearCookie('CSID', cookieOptions);
	res.redirect(303, '/console/');
});


module.exports = {
	consoleRouter: router
};
