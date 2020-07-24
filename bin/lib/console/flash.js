'use strict';

const {consoleCookieOptions} = require('../cookie');


function flash(flashOptions = {}) {
	if (!flashOptions.type) {
		flashOptions.type = 'ok';
	}

	if (!this.locals.flashes) {
		this.locals.flashes = [];
	}

	this.locals.flashes.push(flashOptions);
	this.cookie('FC',
		JSON.stringify(this.locals.flashes), consoleCookieOptions);
}


module.exports = () => {
	return (req, res, next) => {
		if (!req.cookies) {
			throw new Error('Flash requires cookie-parser')
		}

		if (req.cookies.FC) {
			res.locals.flashes = JSON.parse(req.cookies.FC);
		}
		res.clearCookie('FC', consoleCookieOptions);

		res.flash = flash;
		next();
	}
}
