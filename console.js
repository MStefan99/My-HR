const express = require('express');


const router = express.Router();


async function redirectIfNotAdmin(req, res, next) {
	// TODO: check if admin and redirect to GET /login if not
	next();
}


router.get('/login', async (req, res) => {

});


router.get('/register', async (req, res) => {

});


router.post('/login', async (req, res) => {

});


router.post('/register', async (req, res) => {

});


router.use(redirectIfNotAdmin);


router.get('/', async (req, res) => {

});


router.post('/logout', async (req, res) => {

});


module.exports = {
	consoleRouter: router
};