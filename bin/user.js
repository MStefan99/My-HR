const express = require('express');
const fs = require('fs');
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const uuid = require('uuid');
const util = require('util');
const multer = require('multer')
const sendMail = require('./mail');
const openDB = require('./db');


const router = express.Router();
const upload = multer({dest: 'uploads/'});
const cookieOptions = {
	httpOnly: true,
	sameSite: 'strict',
	maxAge: 30 * 60 * 1000  // 30 min in milliseconds
};
const publicCache = 'public, max-age=86400'  // 1 day in seconds


unlink = util.promisify(fs.unlink);

router.use(bodyParser.urlencoded({extended: true}));
router.use(cookieParser());


async function createTables() {
	const db = await openDB();
	const tables = await db.all(`select *
                                 from sqlite_master
                                 where type='table'`);
	if (!tables.find(table => table.name === 'sessions')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'sessions.sql'), 'utf-8'));
	}
	if (!tables.find(table => table.name === 'applications')) {
		await db.exec(fs.readFileSync(path.join('database', 'ddl', 'applications.sql'), 'utf-8'));
	}
}


createTables();


async function getSession(req, res, next) {
	const id = req.query.sessionId || req.cookies.SID;
	if (req.query.sessionId) {
		res.cookie('SID', req.query.sessionId, cookieOptions);
	}

	const db = await openDB();
	req.session = await db.get(`select id,
                                       uuid,
                                       email,
                                       ip,
                                       created_at as createdAt
                                from sessions
                                where uuid=$uuid`, {$uuid: id});
	next();
}


async function redirectIfNotAuthorized(req, res, next) {
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	if (!req.session) {
		res.render('user/status', {
			title: 'Not registered',
			info: 'To ensure our data stays safe we\'ve limited who can access this page. To continue, please ' +
				'return to the home page and get a link by filling in a form. We apologize for the inconvenience.'
		});
	} else {
		if (req.session.ip !== ip) {
			res.render('user/status', {
				title: 'Wrong address',
				info: 'To ensure our data stays safe we\'ve limited who can access this page. ' +
					'As a result, you can only view it from the same address as when you had while ' +
					'getting your link on the home page. Open the link from that address or create a new link by ' +
					'returning to the home page. We apologize for the inconvenience.'
			});
		} else {
			next();
		}
	}
}


async function redirectIfExpired(req, res, next) {
	if (Date.now() - req.session.createdAt > cookieOptions.maxAge) {
		res.render('user/status', {
			title: 'Link expired', info: 'To ensure our data stays safe we\'ve limited the time during which ' +
				'links are valid. Your one has now expired, meaning you need to return to the home page ' +
				'and get the new link to continue using the website. We apologize for the inconvenience.'
		});
	} else {
		next();
	}
}


router.get('/', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/register');
});


router.post('/register', async (req, res) => {
	const email = req.body.username + '@metropolia.fi';
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	const id = uuid.v4();

	const db = await openDB();
	await db.run(`insert into sessions(uuid, email, ip, created_at)
                  values ($uuid, $email, $ip, $time)`,
		{$uuid: id, $email: email, $ip: ip, $time: Date.now()});
	await sendMail(email,
		'Complete your application for Mine Eclipse',
		'registered.html',
		{sid: id});
	res.redirect(303, '/registered/');
});


router.get('/registered', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/status', {
		title: 'Check your email', info: 'We\'ve sent you an email with your link! ' +
			'Please follow it to complete your application.'
	});
});


router.use(getSession);
router.use(redirectIfNotAuthorized);


router.post('/join', upload.single('cv'), async (req, res) => {
	const db = await openDB();
	await db.run(`insert into applications(first_name,
                                           last_name,
                                           email,
                                           backup_email,
                                           phone,
                                           backup_phone,
                                           team,
                                           links,
                                           free_form,
                                           file_name,
                                           file_path)
                  values ($fn, $ln, $email, $be, $phone, $bp, $team, $links, $ff, $fln, $flp)`, {
		$fn: req.body.firstName.trim(),
		$ln: req.body.lastName.trim(),
		$email: req.session.email.trim(),
		$be: req.body.backupEmail.trim(),
		$phone: req.body.phone.trim(),
		$bp: req.body.backupPhone.trim(),
		$team: req.body.team,
		$links: req.body.links,
		$ff: req.body.freeForm,
		$fln: req.file.originalname,
		$flp: req.file.filename
	});  // TODO: handle exceptions
	res.redirect(303, '/success/');
});


router.get('/success', async (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/status', {
		title: 'Thank you',
		info: 'We have received your application and will contact you as soon as possible.'
	});
});


router.use(redirectIfExpired)


router.get('/manage', (req, res) => {
	res.set('Cache-control', publicCache);
	res.render('user/manage');
});


router.get('/applications', async (req, res) => {
	const db = await openDB();
	const applications = await db.all(`select id,
                                              backup_email as backupEmail,
                                              phone,
                                              file_name    as fileName,
                                              file_path    as filePath,
                                              accepted
                                       from applications
                                       where email=$email`, {$email: req.session.email});
	res.json(applications);
});


router.get('/download/:path', async (req, res) => {
	res.set('Cache-control', publicCache);
	const db = await openDB();
	const file = await db.get(`select file_name as fileName
                               from applications
                               where email=$email
                                 and file_path=$path`,
		{$email: req.session.email, $path: req.params.path});
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
	const db = await openDB();
	const application = await db.get(`select file_path as filePath
                                      from applications
                                      where email=$email
                                        and id=$id
                                        and accepted!=1`,
		{$email: req.session.email, $id: req.params.id});
	if (application) {
		await unlink(path.join(__dirname, '..', 'uploads', application.filePath));
		await db.run(`delete
                      from applications
                      where id=$id`,
			{$id: req.params.id})
	} else {
		res.status(400);
	}
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
}
