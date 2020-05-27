const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const uuid = require('uuid');


const app = express();


async function openDB() {
	const db = await sqlite.open({
		filename: 'database/db.sqlite',
		driver: sqlite3.Database
	});
	await db.run(`pragma foreign_keys = on;`);

	return db;
}


async function sendMail() {

}


async function redirectIfNotAuthorized(req, res, next) {
	const db = await openDB();
	const session = await db.get(`select *
                            from sessions
                            where uuid = $uuid`, {$uuid: req.query.sessionId});
	if (session) {
		next();
	} else {
		res.redirect(303, '/');
	}
}


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', (req, res) => {
	res.render('auth');
});


app.post('/register', async (req, res) => {
	const email = req.body.username + '@metropolia.fi';
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	const db = await openDB();
	await db.run(`insert into sessions(uuid, email, ip, created_at)
                  values ($uuid, $email, $ip, $time)`,
		{$uuid: uuid.v4(), $email: email, $ip: ip, $time: Date.now()});
	await sendMail();
	res.redirect(303, '/registered/');
});


app.get('/registered', (req, res) => {
	res.render('registered');
});


app.use(redirectIfNotAuthorized);


app.get('/join', async (req, res) => {
	res.render('main');
});


app.post('/join', async (req, res) => {
	// TODO: add application to the db
	res.redirect(303, '/success/');
});


app.get('/success', async (req, res) => {
	res.render('success');
});


http.createServer(app.listen(3001, () => {
	console.log('Listening on http://localhost:3001');
}));
