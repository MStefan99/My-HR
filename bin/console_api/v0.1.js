'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const util = require('util');

const middleware = require('../lib/console/middleware');
const libAuth = require('../lib/console/auth');
const libFeedback = require('../lib/feedback');
const libApplication = require('../lib/application');
const libSession = require('../lib/console/session');
const libUser = require('../lib/console/user');
const libNote = require('../lib/console/note');
const libProposal = require('../lib/console/proposal');
const lib2FA = require('../lib/console/2fa');

const sendMail = require('../lib/mail');
const {consoleCookieOptions} = require('../lib/cookie');

const readFile = util.promisify(fs.readFile);


const router = express.Router();


router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(cookieParser());
router.use(middleware.getSession);
router.use(middleware.getUser);


router.get('/otp', async (req, res) => {
	if (req.user === 'NO_USER') {
		res.status(401).send('NO_USER');
	} else {
		res.json(lib2FA.generateSecret(req.user));
	}
});


router.post('/verify-login', async (req, res) => {
	req.user = await libUser.getUserByUsername(req.body.username);

	if (req.user === 'NO_USER') {
		res.status(400).send('NO_USER');
	} else if (!req.user.passwordHash) {
		res.sendStatus(200);
	} else if (!req.user.verifyPassword(req.body.password)) {
		res.status(403).send('WRONG_PASSWORD');
	} else if (!req.user.secret) {
		res.sendStatus(200);
	} else if (!lib2FA.verifyOtp(req.user.secret, req.body.token)) {
		res.status(403).send('WRONG_TOKEN');
	} else {
		res.sendStatus(200);
	}
});


router.post('/verify-setup-code', async (req, res) => {
	// User is retrieved using CUID cookie

	if (req.user === 'NO_USER') {
		res.status(401).send('NO_USER');
	} else if (!req.body.setupCode) {
		res.status(400).send('NO_CODE');
	} else if (req.body.setupCode !== req.user.setupCode) {
		res.status(403).send('WRONG_CODE');
	} else {
		res.sendStatus(200);
	}
});


router.post('/verify-otp', (req, res) => {
	if (!req.body.secret) {
		res.status(400).send('NO_SECRET');
	} else if (!req.body.token) {
		res.status(400).send('NO_TOKEN');
	} else if (!lib2FA.verifyOtp(req.body.secret, req.body.token)) {
		res.status(403).send('WRONG_TOKEN');
	} else {
		res.sendStatus(200);
	}
});


router.use((req, res, next) => {
	const status = libAuth.checkAuthStatus(req.session,
		req.user,
		req.get('user-agent'),
		req.ip,
		consoleCookieOptions.maxAge);
	if (status === 'NO_SESSION') {
		res.status(401).send(status);
	} else if (status !== 'OK') {
		res.status(403).send(status);
	} else {
		next();
	}
});


router.get('/access-level', (req, res) => {
	res.send(libAuth.getPrivileges(req.user));
});


router.get('/applications', async (req, res) => {
	let applications;
	if (req.query.type === 'stars') {
		applications = await libApplication.getApplicationsStarredByUser(req.user);
	} else {
		applications = await libApplication.getApplicationsByType(req.query.type);
	}

	res.json(applications);
});


router.get('/applications/:applicationID', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		application.starred = await application.isStarredByUser(req.user);
		application.proposals = await libProposal
			.getApplicationProposalCount(application);
		application.proposals.needed = libProposal.proposalsNeeded;
		application.proposals.my = (await libProposal
			.getProposal(req.user, application)).status;

		res.json(application);
	}
});


router.get('/versions', async (req, res) => {
	res.set('Content-Type', 'application/json');
	const versions = await readFile(path.join(__dirname, '..', '..', 'versions.json'));

	res.send(versions);
});


router.get('/feedback', async (req, res) => {
	const feedback = await libFeedback.getAllFeedback();

	res.json(feedback);
});


router.post('/applications/:applicationID/stars', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (await req.user.starApplication(application)) {
			case 'ALREADY_STARRED':
				res.status(400).send('ALREADY_STARRED');
				break;
			case 'OK':
				res.sendStatus(201);
				break;
		}
	}
});


router.delete('/applications/:applicationID/stars', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.applicationID);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (await req.user.unstarApplication(application)) {
			case 'NOT_STARRED':
				res.status(400).send('NOT_STARRED');
				break;
			case 'OK':
				res.sendStatus(200);
				break;
		}
	}
});


router.get('(/applications/:applicationID)?/notes', async (req, res) => {
	let notes = [];

	if (!req.params.applicationID) {
		notes = await libNote.getCommonNotes(req.user);
	} else {
		const application = await libApplication
			.getApplicationByID(req.params.applicationID);

		if (application !== 'NO_APPLICATION') {
			notes = await libNote.getApplicationNotes(req.user, application);
		}
	}

	for (const note of notes) {
		//TODO: optimize username fetching
		const author = await libUser.getUserByID(note.userID);

		note.my = note.userID === req.user.id;
		note.author = author.username;
		delete note.userID;
		delete note.applicationID;
	}

	res.json(notes);
});


router.post('(/applications/:applicationID)?/notes', async (req, res) => {
	let application = null;

	if (req.params.applicationID) {
		application = await libApplication
			.getApplicationByID(req.params.applicationID);

		if (application === 'NO_APPLICATION') {
			application = null;
		}
	}

	const note = await libNote.createNote(req.user,
		application,
		req.body.shared,
		req.body.message);
	switch (note) {
		case 'NO_MESSAGE':
			res.status(400).send('NO_MESSAGE');
			break;
		default:
			delete note.userID;
			delete note.applicationID;

			note.my = true;
			note.author = req.user.username;

			res.status(201).json(note);
			break;
	}
});


router.delete('/notes', async (req, res) => {
	const note = await libNote.getNoteByID(req.body.id);

	if (note.userID !== req.user.id) {
		res.status(403).send('NOT_ALLOWED');
	} else {
		await note.delete();
		res.sendStatus(200);
	}
});


router.post('/applications/:applicationID/proposals', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.applicationID);
	const proposal = await libProposal.createProposal(req.user, application, req.body.status);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else {
		switch (proposal) {
			case 'INVALID_STATUS':
				res.status(400).send('INVALID_STATUS');
				break;
			case 'ALREADY_ACCEPTED':
				res.status(400).send('ALREADY_ACCEPTED');
				break;
			case 'ALREADY_REJECTED':
				res.status(400).send('ALREADY_REJECTED');
				break;
			case 'ALREADY_EXISTS':
				res.status(400).send('ALREADY_EXISTS');
				break;
			case 'ACCEPTED':
				await libNote.createNote(await libUser.getUserByID(0),
					application,
					true,
					'Application was accepted by ' + req.user.username);

				await sendMail(application.email,
					'Welcome to Mine Eclipse!',
					'accepted.html',
					{name: application.firstName});

				res.status(201).send('ACCEPTED');
				break;
			case 'REJECTED':
				await libNote.createNote(await libUser.getUserByID(0),
					application,
					true,
					'Application was rejected by ' + req.user.username);
				res.status(201).send('REJECTED');

				await sendMail(application.email,
					'Your Mine Eclipse application',
					'rejected.html',
					{name: application.firstName});

				break;
			default:
				await libNote.createNote(await libUser.getUserByID(0),
					application,
					true,
					req.user.username + ' proposed to '
					+ (req.body.status === 1? 'accept' : 'reject') + ' this application');

				res.sendStatus(201);
				break;
		}
	}
});


router.delete('/applications/:applicationID/proposals', async (req, res) => {
	const application = await libApplication.getApplicationByID(req.params.applicationID);
	const proposal = await libProposal.getProposal(req.user, application);

	if (application === 'NO_APPLICATION') {
		res.status(404).send('NO_APPLICATION');
	} else if (proposal === 'NO_PROPOSAL') {
		res.status(404).send('NO_PROPOSAL');
	} else {
		switch (await proposal.delete()) {
			case 'ALREADY_ACCEPTED':
				res.status(400).send('ALREADY_ACCEPTED');
				break;
			case 'ALREADY_REJECTED':
				res.status(400).send('ALREADY_REJECTED');
				break;
			case 'OK':
				await libNote.createNote(await libUser.getUserByID(0),
					application,
					true,
					req.user.username + ' took back his proposal');

				res.sendStatus(200);
				break;
		}
	}
});


router.get('/sessions', async (req, res) => {
	const sessions = await libSession.getUserSessions(req.user);

	for (const session of sessions) {
		delete session.id;
		delete session.userID;
	}

	res.json(sessions);
});


router.delete('/sessions', async (req, res) => {
	const session = await libSession.getSessionByUUID(req.body.sessionID)

	switch (session) {
		case 'NO_SESSION':
			res.status(400).send('NO_SESSION');
			break;
		default:
			await session.delete();

			res.sendStatus(200);
			break;
	}
});


router.use((req, res, next) => {
	const privileges = libAuth.getPrivileges(req.user);
	
	if (privileges !== 'ADMIN') {
		res.status(403).send('NOT_ENOUGH_PERMISSIONS')
	} else {
		next();
	}
});


router.get('/users', async (req, res) => {
	const users = await libUser.getAllUsers();

	for (const user of users) {
		user.otpSetup = !!user.secret;
		delete user.id;
		delete user.passwordHash;
		delete user.secret;
	}
	res.json(users);
});


router.post('/users', async (req, res) => {
	const user = await libUser.createUser(req.body.username,
		!!req.body.admin);
	switch (user) {
		case 'DUPLICATE_USERNAME':
			res.status(400).send('DUPLICATE_USERNAME');
			break;
		default:
			user.otpSetup = !!user.secret;
			delete user.id;
			delete user.passwordHash;
			delete user.secret;

			res.status(201).json(user);
			break;
	}
});


router.patch('/users', async (req, res) => {
	const user = await libUser.getUserByUsername(req.body.username);

	if (req.body.resetPassword) {
		if (await user.resetPassword() === 'CANNOT_RESET_SYSTEM') {
			res.status.send('CANNOT_RESET_SYSTEM');
			return;
		}
	}
	if (req.body.resetOTP) {
		if (await user.resetOTP() === 'CANNOT_RESET_SYSTEM') {
			res.status.send('CANNOT_RESET_SYSTEM');
			return;
		}
	}
	user.otpSetup = !!user.secret;
	delete user.id;
	delete user.passwordHash;
	delete user.secret;

	res.json(user);
});


router.delete('/users', async (req, res) => {
	const user = await libUser.getUserByUsername(req.body.username);

	switch (await user.delete()) {
		case 'CANNOT_DELETE_ADMIN':
			res.status(403).send('CANNOT_DELETE_ADMIN');
			break;
		case 'OK':
			res.sendStatus(200);
			break;
	}
});


router.all('*', (req, res) => {
	res.sendStatus(404);
});


module.exports = {
	apiRouter0_1: router
};
