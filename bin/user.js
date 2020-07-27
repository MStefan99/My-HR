'use strict';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');

const sendMail = require('./lib/mail');
const middleware = require('./lib/user/middleware');
const libSetup = require('./lib/user/setup');
const libFeedback = require('./lib/feedback');
const libSession = require('./lib/user/session');
const libApplication = require('./lib/application');
const libUser = require('./lib/console/user');
const libNote = require('./lib/console/note');

const flash = require('./lib/flash');


const router = express.Router();
const upload = multer({dest: 'uploads/'});
const publicCache = process.env.NO_CACHE ?
	'no-cache' : 'public, max-age=86400';  // 1 day in seconds
const privateCache = process.env.NO_CACHE ?
	'no-cache' : 'private, max-age=86400';  // 1 day in seconds


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());
router.use(flash());


libSetup.init();


router.get('/', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('user/home');
});

router.get('/feedback', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('user/feedback');
});


router.post('/feedback', async (req, res) => {
	if (!req.body.message) {
		res.flash({
			type: 'error',
			title: 'No message',
			info: 'You have submitted a feedback without a ' +
				'message. Please return and try again.'
		}).redirect(303, '/feedback/');
	} else {
		await libFeedback.createFeedback(req.body.name,
			req.body.email,
			req.body.message);

		res.flash({
			title: 'Thank you',
			info: 'Thank you for your feedback! We will carefully ' +
				'study it and improve our website in the future!'
		}).redirect(303, '/');
	}
});


router.use(middleware.redirectIfApplicationPeriodEnded);
if (process.env.USER_AUTH) {
	router.use((req, res, next) => {
		if (!req.cookies.CSID) {
			res.flash({
				type: 'warning',
				title: 'Beta mode',
				info: 'This website is now in closed beta so you have to sign in ' +
					'to continue using the website. If you do not know how to do it, ' +
					'please return back later, when beta testing is over.'
			}).redirect(303, '/');
		} else {
			next();
		}
	});
}


router.post('/register', async (req, res) => {
	if (!req.body.username) {
		res.flash({
			type: 'error',
			title: 'No email',
			info: 'You have submitted an empty email address, ' +
				'please try again.'
		}).redirect(303, '/');
	} else if (req.body.username.match('@')) {
		res.flash({
			type: 'error',
			title: 'Invalid email format',
			info: 'You have submitted an invalid email address, ' +
				'please try again.'
		}).redirect(303, '/');
	} else {
		const session = await libSession.createSession(req.body.username,
			req.ip);

		await sendMail(session.email,
			'Complete your application for Mine Eclipse',
			'registered.html',
			{uuid: session.uuid});

		res.flash({
			title: 'Check your email',
			info: 'We\'ve sent you an email with your link! ' +
				'Please follow it to complete your application.'
		}).redirect(303, '/')
	}
});


router.use(middleware.getSession);
router.use(middleware.redirectIfNotAuthorized);
router.use(middleware.redirectIfExpired);


router.post('/join', upload.single('cv'), async (req, res) => {
	if (!req.body.firstName ||
		!req.body.lastName ||
		!req.body.email ||
		!req.body.backupEmail ||
		!req.body.phone ||
		!req.body.team ||
		!req.file) {
		res.flash({
			type: 'error',
			title: 'Missing information',
			info: 'Some required fields in your ' +
				'form were missing, please try again.'
		}).redirect(303, '/join/');
	} else {
		const application = await libApplication
			.createApplication(req.session, {
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				backupEmail: req.body.backupEmail,
				phone: req.body.phone,
				backupPhone: req.body.backupPhone,
				team: req.body.team,
				links: req.body.links,
				freeForm: req.body.freeForm,
				fileName: req.file.originalname,
				filePath: req.file.filename
			});
		await libNote.createNote(await libUser.getUserByID(0),
			application,
			true,
			'Application created');

		res.flash({
			title: 'Thank you', info: 'We have received ' +
				'your application and will contact you as soon as possible. ' +
				'In the meantime, would you mind telling us about your ' +
				'experience on our website?'
		}).redirect(303, '/feedback/');
	}
});


router.get('/manage', (req, res) => {
	res.set('Cache-Control', publicCache);
	res.render('user/manage');
});


router.get('/applications', async (req, res) => {
	const applications = await libApplication.getApplicationsBySession(req.session);

	res.json(applications);
});


router.get('/download/:path', async (req, res) => {
	const application = await libApplication.getApplicationByFilePath(req.params.path);

	if (application === 'NO_APPLICATION') {
		res.flash({
			type: 'error',
			title: 'No such file',
			info: 'The file requested was not found in the system. ' +
				'Please check the address and try again.'
		}).redirect('back');
	} else if (req.session.email !== application.email) {
		res.flash({
			type: 'error',
			title: 'Not allowed',
			info: 'The file requested was submitted by another user ' +
				'and you are not allowed to view or download it. If you think this is a ' +
				'mistake, please check whether the address you\'ve entered is correct'
		}).redirect('back');
	} else {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.path), application.fileName);
	}
});


router.delete('/applications/:id', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.id);

	if (application === 'NO_APPLICATION') {
		res.status(400).send('NO_APPLICATION');
	} else if (req.session.email !== application.email) {
		res.status(403).send('NOT_ALLOWED');
	} else {
		switch (await application.delete()) {
			case 'OK':
				res.send('OK');
				break;
			case 'ALREADY_ACCEPTED':
				res.status(400).send('ALREADY_ACCEPTED');
				break;
		}
	}
});


router.get('/join', (req, res) => {
	res.set('Cache-Control', privateCache);
	res.render('user/join', {email: req.session.email});
});


router.all('*', (req, res) => {
	res.status(404).render('user/404');
});


module.exports = {
	applicationRouter: router
};
