const twoFactor = require('node-2fa');


function generateSecret(user) {
	return twoFactor.generateSecret({name: 'My HR', account: user.username || 'My HR'});
}


function verifyOtp(user, otp) {
	const delta = twoFactor.verifyToken(user.secret, otp);
	if (!delta) {
		return false;
	} else {
		return delta.delta === 0;
	}
}


module.exports = {
	generateSecret: generateSecret,
	verifyOtp: verifyOtp
};
