'use strict';

const dataCookieOptions = {
	httpOnly: true,
	maxAge: 60 * 60 * 24 * 7,
	sameSite: 'strict',
};


function flash(flashOptions = {}) {
	if (!flashOptions.type) {
		flashOptions.type = 'ok';
	}

	if (!this.nextFlashes) {
		this.nextFlashes = [];
	}

	const flashData = JSON.stringify(flashOptions);
	this.nextFlashes.push(Buffer
	.from(flashData)
	.toString('base64'));
	this.cookie('FC',
		JSON.stringify(this.nextFlashes), dataCookieOptions);

	return this;
}


module.exports = () => {
	return (req, res, next) => {
		if (req.cookies === undefined) {
			throw new Error('Flash requires cookie-parser')
		}

		if (req.cookies.FC) {
			const flashes = JSON.parse(req.cookies.FC);
			res.locals.flashes = [];

			flashes.forEach(flashData => {
				res.locals.flashes.push(JSON.parse(
					Buffer
					.from(flashData, 'base64')
					.toString()));
			});
			res.clearCookie('FC', dataCookieOptions);
		}

		res.flash = flash;
		next();
	}
};
