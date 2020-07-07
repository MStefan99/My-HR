'use strict';

usernameElement = document.querySelector('#username')
otpElement = document.querySelector('#otp')

usernameLabel = document.querySelector('#u-label')
otpLabel = document.querySelector('#otp-label')

submitButton = document.querySelector('#submit')


validate = ->
	submitButton.disabled = false

	if !usernameElement.value.length
		usernameLabel.innerHTML = 'No username'
		usernameElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		usernameLabel.innerHTML = ''
		usernameElement.classList.remove('status-bad')

	if otpElement.value and not otpElement.value.match(/^\d{6}$/)
		otpLabel.innerHTML = 'Wrong format'
		otpElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		otpLabel.innerHTML = ''
		otpElement.classList.remove('status-bad')


addEventListener('load', validate)
addEventListener('keyup', validate)
setInterval(validate, 1000)
