'use strict';

const {dataCookieOptions} = require('./cookie');


function flash(flashOptions = {}) {
	if (!flashOptions.type) {
		flashOptions.type = 'ok';
	}

	if (!this.nextFlashes) {
		this.nextFlashes = [];
	}

	this.nextFlashes.push(flashOptions);
	this.cookie('FC',
		JSON.stringify(this.nextFlashes), dataCookieOptions);

	return this;
}


module.exports = () => {
	return (req, res, next) => {
		if (!req.cookies) {
			throw new Error('Flash requires cookie-parser')
		}

		if (req.cookies.FC) {
			res.locals.flashes = JSON.parse(req.cookies.FC);
		}
		res.clearCookie('FC', dataCookieOptions);

		res.flash = flash;
		next();
	}
}
