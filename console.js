const express = require('express');
const path = require('path');


const router = express.Router();


async function redirectIfNotAdmin(req, res, next) {
	// TODO: check if admin and redirect to GET /login if not
	next();
}


router.get('/login', async (req, res) => {
	res.render('console/login');
});


router.get('/register', async (req, res) => {
	res.render('console/register');
});


router.post('/login', async (req, res) => {

});


router.post('/register', async (req, res) => {

});


router.use(redirectIfNotAdmin);


router.get('/', async (req, res) => {
	res.render('console/home');
});


router.get('/', async (req, res) => {
	res.render('console/settings');
});


router.get('/file/:name', async (req, res) => {
	res.sendFile(path.join(__dirname, '/uploads/' , req.params.name));
});


router.post('/logout', async (req, res) => {

});


module.exports = {
	consoleRouter: router
};