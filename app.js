'use strict';

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const {applicationRouter} = require('./bin/user');
const {consoleRouter} = require('./bin/console');
const {internalRouter} = require('./bin/lib/internal');


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
app.use((req, res, next) => {
	res.set('Cache-Control', 'no-cache');
	res.set('Referrer-Policy', 'same-origin');
	res.set('Service-Worker-Allowed', '/');
	res.set('Content-Security-Policy', 'default-src \'self\'; img-src \'self\' https://*.googleapis.com');
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('X-Frame-Options', 'SAMEORIGIN');
	res.set('Vary', 'Origin');
	res.set('Access-Control-Allow-Origin', '"null"');
	if (!process.env.NO_HTTPS) {
		res.set('Strict-Transport-Security', 'max-age=31536000'); // 1 year in seconds
	}
	next();
});
app.use('/style', express.static(path.join(__dirname, 'static', 'style'), cacheOptions));
app.use('/js', express.static(path.join(__dirname, 'static', 'js'), cacheOptions));
app.use('/img', express.static(path.join(__dirname, 'static', 'img'), cacheOptions));
app.use('/favicon.ico', express.static(path.join(__dirname, 'static', 'img', 'me-logo.svg'), cacheOptions));
app.use('/int', internalRouter);
app.use('/console', consoleRouter);
app.use(applicationRouter);


if (process.env.NO_HTTPS) {
	http.createServer(app).listen(80);
	console.log('Listening on HTTP, port 80');
} else {
	const serverOptions = {
		hostname: 'apply.mineeclipse.com',
		path: '/',
		key: fs.readFileSync(process.env.KEYFILE),
		cert: fs.readFileSync(process.env.CERTFILE),
		ca: fs.readFileSync(process.env.CA)
	};

	https.createServer(serverOptions, app).listen(443);
	console.log('Listening on HTTPS, port 443');
	http.createServer((req, res) => {
		res.writeHead(301, {"Location": "https://" + req.headers['host'] + req.url});
		res.end();
	}).listen(80);
	console.log('HTTP redirect enabled, port 80 -> 443');
}
