const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');
const sendMail = require('./lib/mail');

const middleware = require('./lib/user/middleware');
const libApplication = require('./lib/application');
const libSetup = require('./lib/user/setup');
const libSession = require('./lib/user/session');


const router = express.Router();
const upload = multer({dest: 'uploads/'});
const publicCache = process.env.NO_CACHE ? 'no-cache' : 'public, max-age=86400'  // 1 day in seconds


router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


libSetup.init();


router.get('/', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/register');
});


router.post('/register', async (req, res) => {
	const user = await libSession.createSession(req.body.username,
		req.headers['x-forwarded-for'] || req.connection.remoteAddress);

	await sendMail(user.email,
		'Complete your application for Mine Eclipse',
		'registered.html',
		{sid: user.id});
	res.redirect(303, '/registered/');
});


router.get('/registered', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/status', {
		title: 'Check your email', info: 'We\'ve sent you an email with your link! ' +
			'Please follow it to complete your application.'
	});
});


router.use(middleware.getSession);
router.use(middleware.redirectIfNotAuthorized);


router.post('/join', upload.single('cv'), async (req, res) => {
	await libApplication.createApplication({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.session.email,
		backupEmail: req.body.backupEmail,
		phone: req.body.phone,
		backupPhone: req.body.backupPhone,
		team: req.body.team,
		links: req.body.links,
		freeForm: req.body.freeForm,
		fileName: req.file.originalname,
		filePath: req.file.filename
	});
	res.redirect(303, '/success/');
});


router.get('/success', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/status', {
		title: 'Thank you',
		info: 'We have received your application and will contact you as soon as possible.'
	});
});


router.use(middleware.redirectIfExpired);


router.get('/manage', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/manage');
});


router.get('/applications', async (req, res) => {
	res.json(await libApplication.getUserApplications(req.session.email));
});


router.get('/download/:path', async (req, res) => {
	res.set('Cache-control', publicCache);
	const file = await libApplication.getUserAttachment(req.session.email, req.params.path);
	if (file) {
		res.download(path.join(__dirname, '..', '/uploads/', req.params.path), file.fileName);
	} else {
		res.render('user/status', {
			title: 'No such file', info: 'The file requested was not found in the system. ' +
				'Please check the address and try again.'
		});
	}
});


router.delete('/applications/:id', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.id);
	await libApplication.deleteUserApplication(application, req.params.id);
	res.end();
});


router.get('/join', (req, res) => {
	res.render('user/join', {email: req.session.email});
});


router.use((req, res, next) => {
	res.status(404).render('user/404');
});


module.exports = {
	applicationRouter: router
};
