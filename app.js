'use strict';

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const {applicationRouter} = require('./bin/user');
const {consoleRouter} = require('./bin/console');
const {internalRouter} = require('./bin/internal');


const publicCache = process.env.NO_CACHE ? 'no-cache' : 'public, max-age=604800';  // 1 week in seconds
const app = express();


const cacheOptions = {
	setHeaders: (res, path, stat) => {
		res.set('Cache-control', publicCache);
	}
};


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use((req, res, next) => {
	res.set('Vary', 'Cookie');
	res.set('Referrer-Policy', 'same-origin');
	res.set('Content-Security-Policy', 'default-src \'self\'; img-src \'self\' https://*.googleapis.com');
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('X-Frame-Options', 'SAMEORIGIN');
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
	console.log('Listening on HTTP');
} else {
	const serverOptions = {
		hostname: 'apply.mineeclipse.com',
		path: '/',
		key: fs.readFileSync('/etc/letsencrypt/live/apply.mineeclipse.com/privkey.pem'),
		cert: fs.readFileSync('/etc/letsencrypt/live/apply.mineeclipse.com/cert.pem'),
		ca: fs.readFileSync('/etc/letsencrypt/live/apply.mineeclipse.com/fullchain.pem')
	};

	https.createServer(serverOptions, app).listen(443);
	console.log('Listening on HTTPS');
	http.createServer((req, res) => {
		res.writeHead(301, {"Location": "https://" + req.headers['host'] + req.url});
		res.end();
	}).listen(80);
	console.log('HTTP redirect enabled');
}
