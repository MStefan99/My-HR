const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const uuid = require('uuid');
const twoFactor = require('node-2fa');
const openDB = require('./db');


const router = express.Router();
const cookieOptions = {
	httpOnly: true,
	sameSite: 'strict',
	maxAge: 24 * 60 * 60 * 1000
};  // 1 day in milliseconds
const hashSecret = 'Your HR secret key'


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(getUser)


async function addAdmin() {
	const db = await openDB();
	const users = await db.get(`select *
                                from console_users`);
	if (!users) {
		await db.run(`insert into console_users(username, uuid, admin, setup_code)
                      values ('admin', $id, 1, 'admin')`, {$id: uuid.v4()});
	}
}

async function createTables() {
	const db = await openDB();
	const tables = await db.all(`select *
                                 from sqlite_master
                                 where type='table'`);
	if (!tables.find(table => table.name === 'console_users')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_users.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'console_sessions')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_sessions.sql'), 'utf-8'));
	}
}

async function initialize() {
	await createTables();
	await addAdmin();
}


initialize();


async function getUser(req, res, next) {
	if (req.cookies.CSID) {
		const db = await openDB();
		req.user = await db.get(`select cu.id         as id,
                                        cs.id         as sessionID,
                                        username,
                                        password_hash as passwordHash,
                                        cu.uuid       as userUUID,
                                        cs.uuid       as sessionUUID,
                                        setup_code,
                                        admin,
                                        secret
                                 from console_sessions cs
                                          left join console_users cu on cs.user_id=cu.id
                                 where cs.uuid=$sid`, {$sid: req.cookies.CSID})
	}
	next();
}


async function redirectIfNotAuthorized(req, res, next) {
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


async function redirectIfNotAdmin(req, res, next) {
	if (!req.user.admin) {
		res.render(303, '/console/');
	} else {
		next();
	}
}


async function logOut(id) {
	const db = await openDB();
	await db.run(`delete
                  from console_sessions
                  where user_id=$id`, {$id: id});
}


router.get('/login', (req, res) => {
	res.render('console/login');
});


router.get('/register', (req, res) => {
	res.render('console/register');
});


router.get('/get-otp', async (req, res) => {
	const db = await openDB();
	const user = await db.get(`select username
                               from console_users
                               where uuid=$id`, {$id: req.cookies.CUID});
	const secret = twoFactor.generateSecret({name: 'My HR', account: user.username || 'My HR'});
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
                               where username=$username`, {$username: req.body.username.trim()});
	const hash = crypto.createHmac('sha512', hashSecret);
	hash.update(req.body.password);

	if (!user) {
		res.render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (!user.passwordHash) {
		res.cookie('CUID', user.uuid, cookieOptions);
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
	const user = await db.get(`select id,
                                      uuid,
                                      username,
                                      setup_code as setupCode
                               from console_users
                               where username=$username`, {$username: req.body.username.trim()});

	if (!user) {
		res.render('console/status', {
			title: 'No such user', info: 'Please check if the username you entered is correct ' +
				'and try again.'
		});
	} else if (user.setupCode !== req.body.setupCode.trim()) {
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
                      where id=$id`, {
			$id: user.id,
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
		res.render('console/status', {
			title: 'Success', info: 'You can log in with your new account now!'
		});
	}
});


router.use(redirectIfNotAuthorized);


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
	res.render('console/settings', {user: req.user});
});


router.post('/settings', async (req, res) => {
	const db = await openDB();

	if (req.body.password !== req.body.passwordRepeat) {
		res.render('console/status', {
			title: 'Passwords do not match', info: 'Please return to ' +
				'settings page and retype your password.'
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
                      set password_hash=$hash
                      where id=$id`, {
			$id: req.user.id,
			$hash: hash.digest('hex'),
		});
		await logOut(req.user.id);
		res.clearCookie('CSID', cookieOptions);
		res.render('console/status', {
			title: 'Success', info: 'You can log in with your new password now. ' +
				'Note that you have been logged out on all devices.'
		});
	}
});


router.get('/exit', async (req, res) => {
	await logOut(req.user.id);
	res.redirect('/console/login/');
});


router.get('/file/:name', async (req, res) => {
	const db = await openDB();
	const file = await db.get(`select file_name as fileName,
                                      file_path as filePath
                               from applications
                               where file_path=$path`,
		{$path: req.params.name});
	if (file) {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.name), file.fileName);
	} else {
		res.status(404).end();
	}
});


router.get('/sessions', async (req, res) => {
	const db = await openDB();
	const sessions = await db.all(`select ip, ua, time
                                   from console_sessions
                                   where user_id=$id`, {$id: req.user.id});
	res.json(sessions);
});


router.get('/logout', async (req, res) => {
	const db = await openDB();
	await db.run(`delete
                  from console_sessions
                  where id=$id`, {$id: req.user.sessionID});
	res.clearCookie('CSID', cookieOptions);
	res.redirect(303, '/console/');
});


router.use(redirectIfNotAdmin);


router.get('/users', (req, res) => {
	res.render('console/users');
});


router.get('/users/remove/:username', async (req, res) => {
	if (req.params.username !== 'admin') {
		const db = await openDB();
		await db.run(`delete
                      from console_users
                      where username=$username`, {$username: req.params.username});
	}
	res.redirect('/console/users/');
});


router.post('/users', async (req, res) => {
	const db = await openDB();
	await db.run(`insert into console_users(username, admin, uuid, setup_code)
                  values ($username, $admin, $id, $code)`, {
		$username: req.body.username,
		$admin: req.body.admin || 0,
		$id: uuid.v4(),
		$code: uuid.v4()
	}).catch(() => {
	});
	res.redirect('/console/users/');
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
	res.json(users);
});


module.exports = {
	consoleRouter: router
};
