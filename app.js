const express = require('express');
const http = require('http');
const path = require('path');
const {applicationRouter} = require('./bin/user');
const {consoleRouter} = require('./bin/console');

const aggressiveCaching = {
	setHeaders: (res, path, stat) => {
		res.set('Cache-control', 'public, max-age=604800');  // 1 week in seconds
	}
};


const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/style', express.static(path.join(__dirname, 'static', 'style'), aggressiveCaching));
app.use('/js', express.static(path.join(__dirname, 'static', 'js'), aggressiveCaching));
app.use('/img', express.static(path.join(__dirname, 'static', 'img'), aggressiveCaching));
app.use('/favicon.ico', express.static(path.join(__dirname, 'static', 'img', 'me-logo.svg'), aggressiveCaching));
app.use('/console', consoleRouter);
app.use(applicationRouter);


http.createServer(app.listen(3001, () => {
	console.log('Listening on http://localhost:3001');
}));  // TODO: replace with https
