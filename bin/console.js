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
                                        cu.uuid,
                                        secret
                                 from console_sessions cs
                                          left join console_users cu on cs.user_id = cu.id
                                 where uuid = $sid`, {$sid: req.cookies.CSID})
	}
	next();
}


async function redirectIfNotAdmin(req, res, next) {
	if (req.user) {
		next();
	} else {
		res.redirect(303, '/console/login');
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
	res.json({qr: secret.qr, secret: secret.secret});
});


router.post('/login', async (req, res) => {
	const db = await openDB();
	const user = await db.get(`select username,
                                      password_hash as passwordHash,
                                      secret
                               from console_users
                               where username = $username`, {$username: req.body.username});
	const hash = crypto.createHmac('sha512', hashSecret);
	hash.update(req.body.password);

	if (!user.passwordHash || !user.secret) {
		res.redirect(303, '/console/register/');
	} else if (user.passwordHash !== hash.digest('hex')) {
		res.render('console/status', {title: 'Wrong password', info: ''});
	} else if (!twoFactor.verifyToken(user.secret, req.body.token)) {
		res.render('console/status', {
			title: 'Wrong authenticator password', info: 'Your one-time password ' +
				'may have expired, please try again.'
		});
	} else {
		const id = uuid.v4();
		req.cookie('CSID', id, cookieOptions);
		await db.run(`insert into console_sessions(uuid, user_id, ip, ua, time)
                      values ($id, $uid, $ip, $ua, $time)`, {
			$uuid: id, $uid: user.id, $ip: req.connection.remoteAddress,
			$ua: req.headers['user-agent'], $time: Date.now()
		});
		req.redirect(303, '/console/home/');
	}
});


router.post('/register', async (req, res) => {
	const db = await openDB();
	if (req.body.password !== req.body.passwordRepeat) {
		res.render('console/status', {
			title: 'Passwords do not match', info: 'Please return to ' +
				'registration and retype your password.'
		});
	} else if (req.body.password.length < 8) {
		res.render('console/status', {
			title: 'Your password is too short', info: 'On this site you will get access to ' +
				'sensitive user data so please ensure your password is at least 8 characters long.'
		});
	} else if (!twoFactor.verifyToken(req.body.secret, req.body.token)) {
		res.render('console/status', {
			title: 'Wrong authenticator password', info: 'Your one-time password ' +
				'may have expired, please try again.'
		});
	} else {
		const hash = crypto.createHmac('sha512', hashSecret);
		hash.update(req.body.password);
		db.run(`update console_users
                set password_hash=$hash,
                    secret=$secret,
                    uuid=null
                where uuid = $id`, {
			$id: req.body.id,
			$hash: hash.digest('hex'),
			$secret: req.body.secret
		});
		res.redirect(303, '/console/login/');
	}
});


router.use(redirectIfNotAdmin);


router.get('verify', (req, res) => {
	res.render('console/message');
})


router.get('/', (req, res) => {
	res.render('console/home');
});


router.get('/settings', (req, res) => {
	res.render('console/settings');
});


router.get('/file/:name', (req, res) => {
	res.sendFile(path.join(__dirname, '/uploads/', req.params.name));
});


router.post('/logout', async (req, res) => {

});


module.exports = {
	consoleRouter: router
};