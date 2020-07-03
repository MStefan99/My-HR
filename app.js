'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const {applicationRouter} = require('./bin/user');
const {consoleRouter} = require('./bin/console');


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
	next();
});
app.use('/style', express.static(path.join(__dirname, 'static', 'style'), cacheOptions));
app.use('/js', express.static(path.join(__dirname, 'static', 'js'), cacheOptions));
app.use('/img', express.static(path.join(__dirname, 'static', 'img'), cacheOptions));
app.use('/favicon.ico', express.static(path.join(__dirname, 'static', 'img', 'me-logo.svg'), cacheOptions));
app.use('/console', consoleRouter);
app.use(applicationRouter);


http.createServer(app.listen(3001, () => {
	console.log('Listening on http://localhost:3001');
}));  // TODO: replace with https
