const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const uuid = require('uuid');
const twoFactor = require('node-2fa');
const sendMail = require('./mail');
const openDB = require('./db');


const router = express.Router();
const hashSecret = 'Your HR secret key'
const cookieOptions = {
	httpOnly: true,
	sameSite: 'strict',
	maxAge: 24 * 60 * 60 * 1000  // 1 day in milliseconds
};
const publicCache = 'public, max-age=86400'  // 1 day in seconds
const privateCache = 'private, max-age=86400'  // 1 day in seconds


router.use('/favicon.ico', express.static(path.join(__dirname, '..', 'static', 'img', 'mh-logo.svg'), {
	setHeaders: (res, path, stat) => {
		res.set('Cache-control', publicCache);
	}
}));
router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(getSession)
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
	if (!tables.find(table => table.name === 'console_stars')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'console_stars.sql'), 'utf-8'));
	}
}

async function initialize() {
	await createTables();
	await addAdmin();
}


initialize();


async function getSession(req, res, next) {
	if (req.cookies.CSID) {
		const db = await openDB();
		req.session = await db.get(`select id,
                                           user_id as userId,
                                           uuid,
                                           ip,
                                           ua,
                                           time
                                    from console_sessions
                                    where uuid=$sid`, {$sid: req.cookies.CSID})
	}
	next();
}


async function getUser(req, res, next) {
	if (req.session) {
		const db = await openDB();
		req.user = await db.get(`select id,
                                        username,
                                        password_hash as passwordHash,
                                        uuid,
                                        setup_code,
                                        admin,
                                        secret
                                 from console_users
                                 where id=$uid`, {$uid: req.session.userId})
	}
	next();
}


async function redirectIfNotAuthorized(req, res, next) {
	if (!req.session) {
		res.redirect(303, '/console/login/');
	} else if (req.session.ua !== req.headers['user-agent']
		|| req.session.ip !== req.connection.remoteAddress
		|| Date.now() - req.session.time > cookieOptions.maxAge) {
		res.redirect('/console/logout/');
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
	const db = await openDB();
	const user = await db.get(`select username
                               from console_users
                               where uuid=$id`, {$id: req.cookies.CUID});
	const secret = twoFactor.generateSecret({name: 'My HR', account: user.username || 'My HR'});
	res.json(secret);
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


router.get('/logout', async (req, res) => {
	const db = await openDB();
	await db.run(`delete
                  from console_sessions
                  where id=$id`, {$id: req.session.id});
	res.clearCookie('CSID', cookieOptions);
	res.redirect(303, '/console/');
});


router.get('/exit', async (req, res) => {
	await logOut(req.user.id);
	res.redirect('/console/login/');
});


router.use(redirectIfNotAuthorized);


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
	const db = await openDB();
	let applications;
	switch (req.query.type) {
		case 'all':
		default:
			applications = await db.all(`select id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications`);
			break;
		case 'stars':
			applications = await db.all(`select a.id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications a
                                                  left join
                                              console_stars cs on a.id=cs.application_id
                                         where cs.user_id=$id
                                         order by cs.id desc`, {$id: req.user.id});
			break;
		case 'accepted':
			applications = await db.all(`select id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications
                                         where accepted=1`);
			break;
		case 'rejected':
			applications = await db.all(`select id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications
                                         where accepted=-1`);
			break;
		case 'pending':
			applications = await db.all(`select id,
                                                first_name as firstName,
                                                last_name  as lastName,
                                                team,
                                                free_form  as freeForm,
                                                accepted
                                         from applications
                                         where accepted=0`);
			break;
	}
	res.json(applications);
});


router.get('/application/', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('console/application');
});


router.get('/get-application/:id', async (req, res) => {
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
                                             file_path    as filePath,
                                             accepted
                                      from applications
                                      where id=$id`,
		{$id: req.params.id});
	if (application) {
		application.starred = !!(await db.get(`select 1
                                               from console_stars
                                               where user_id=$uid
                                                 and application_id=$aid`,
			{$uid: req.user.id, $aid: req.params.id}))
	}
	res.json(application);
});


router.post('/stars', async (req, res) => {
	const db = await openDB();
	await db.run(`insert into console_stars(user_id, application_id)
                  values ($uid, $aid)`,
		{$uid: req.user.id, $aid: req.query.applicationId});
	res.end();
});


router.delete('/stars', async (req, res) => {
	const db = await openDB();
	await db.run(`delete
                  from console_stars
                  where user_id=$uid
                    and application_id=$aid`,
		{$uid: req.user.id, $aid: req.query.applicationId});
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
	res.json(sessions);
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


router.get('/file/:name', async (req, res) => {
	res.set('Cache-control', publicCache);
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


router.use(redirectIfNotAdmin);


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
	res.json(users);
});


router.use((req, res, next) => {
	res.status(404).render('console/404');
});


module.exports = {
	consoleRouter: router
};
