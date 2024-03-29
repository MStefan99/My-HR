'use strict';

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const {applicationRouter} = require('./bin/user');
const {consoleRouter} = require('./bin/console');
const {internalRouter} = require('./bin/lib/internal');
const {apiRouter0_1} = require('./bin/console_api/v0.1');


const publicCache = process.env.NO_CACHE ?
	'no-cache' : 'public, max-age=604800';  // 1 week in seconds
const app = express();


const cacheOptions = {
	setHeaders: (res, path, stat) => {
		res.set('Cache-Control', publicCache);
	}
};


app.set('x-powered-by', false);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.env = process.env.NODE_ENV;

app.use((req, res, next) => {
	res.set('Cache-Control', 'no-cache');
	res.set('Referrer-Policy', 'same-origin');
	res.set('Service-Worker-Allowed', '/');
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('X-Frame-Options', 'SAMEORIGIN');
	res.set('X-XSS-Protection', '1');
	res.set('My-HR-version', app.locals.version);
	if (!process.env.NO_HTTPS) {
		res.set('Strict-Transport-Security', 'max-age=31536000'); // 1 year in seconds
	}
	next();
});

app.use(express.static(path.join(__dirname, 'static'), cacheOptions));
app.use('/favicon.ico', express.static(path.join(__dirname, 'static', 'img', 'me-logo.svg'), cacheOptions));

app.use('/int', internalRouter);
app.use('/console/api/v0.1', apiRouter0_1);
app.use('/console', consoleRouter);
app.use(applicationRouter);

app.use(function (err, req, res, next) {
	console.error(err);

	res.locals.error = req.app.get('env') === 'development' ? err : {};
	res.status(500).render('error');
});


if (process.env.NO_HTTPS) {
	http.createServer(app).listen(3003);
	console.log('Listening on HTTP, port 3003');
} else {
	const serverOptions = {
		key: fs.readFileSync(process.env.KEYFILE),
		cert: fs.readFileSync(process.env.CERTFILE)
	};

	https.createServer(serverOptions, app).listen(443);
	console.log('Listening on HTTPS, port 443');
	http.createServer((req, res) => {
		res.writeHead(301, {'Location': 'https://' + req.headers['host'] + req.url});
		res.end();
	}).listen(80);
	console.log('HTTP redirect enabled, port 80 -> 443');
}


(async () => {
	app.locals.version = JSON.parse(await readFile('versions.json',
		'utf-8'))[0].version;
})();
