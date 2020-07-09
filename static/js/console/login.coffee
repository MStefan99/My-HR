'use strict';

formElement = document.querySelector('form')
usernameElement = document.querySelector('#username')
passwordElement = document.querySelector('#password')
otpElement = document.querySelector('#otp')
usernameLabel = document.querySelector('#u-label')
passwordLabel = document.querySelector('#p-label')
otpLabel = document.querySelector('#otp-label')
submitButton = document.querySelector('#submit-button')


validate = ->
	submitButton.disabled = false

	if !usernameElement.value.length
		usernameLabel.innerHTML = 'No username'
		usernameElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		usernameLabel.innerHTML = ''
		usernameElement.classList.remove('status-bad')

	passwordLabel.innerHTML = ''
	passwordElement.classList.remove('status-bad')

	if otpElement.value and not otpElement.value.match(/^\d{6}$/)
		otpLabel.innerHTML = 'Wrong format'
		otpElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		otpLabel.innerHTML = ''
		otpElement.classList.remove('status-bad')


formElement.addEventListener('submit', (e) ->
	e.preventDefault()
	res = await fetch('/console/verify-login/'
		method: 'post'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			username: usernameElement.value
			token: otpElement.value
			password: passwordElement.value
		)
	).catch(->
		alert('Could not log you in. Please check your internet connection.')
	)

	if not res.ok
		switch await res.text()
			when 'NO_USER'
				usernameLabel.innerHTML = 'No such user'
				passwordElement.classList.add('status-bad')
				submitButton.disabled = true
			when 'WRONG_PASSWORD'
				passwordLabel.innerHTML = 'Wrong password'
				passwordElement.classList.add('status-bad')
				submitButton.disabled = true
			when 'WRONG_TOKEN'
				otpLabel.innerHTML = 'Wrong code'
				otpElement.classList.add('status-bad')
				submitButton.disabled = true
	else
		formElement.submit()
)


addEventListener('load', validate)
addEventListener('input', validate)
