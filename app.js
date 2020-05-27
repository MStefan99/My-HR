const express = require('express');
const http = require('http');
const fs =  require('fs');
const path = require('path');
const app = express();


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/style', express.static(path.join(__dirname, 'style')));


app.get('/', (req, res) => {
	res.render('main');
});


http.createServer(app.listen(3001, () => {
	console.log('Listening on http://localhost:3001');
}));
