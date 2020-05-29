const express = require('express');
const http = require('http');
const path = require('path');
const {applicationRouter} = require('./bin/user');
const {consoleRouter} = require('./bin/console');


const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/style', express.static(path.join(__dirname, 'static', 'style')));
app.use('/js', express.static(path.join(__dirname, 'static', 'js')));
app.use('/console', consoleRouter);
app.use(applicationRouter);


http.createServer(app.listen(3001, () => {
	console.log('Listening on http://localhost:3001');
}));  // TODO: replace with https
