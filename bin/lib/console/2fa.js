'use strict';

const twoFactor = require('node-2fa');


function generateSecret(user) {
	if (!user || user === 'NO_USER') {
		return twoFactor.generateSecret({name: 'My HR', account: 'My HR'});
	} else {
		return twoFactor.generateSecret({name: 'My HR', account: user.username});
	}
}


function verifyOtp(secret, token) {
	if (secret && token) {
		const delta = twoFactor.verifyToken(secret, token);

		if (!delta) {
			return false;
		} else {
			return delta.delta === 0;
		}
	} else {
		return false;
	}
}


module.exports = {
	generateSecret: generateSecret,
	verifyOtp: verifyOtp
};
