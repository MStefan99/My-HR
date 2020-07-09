'use strict';

formElement = document.querySelector('form')
usernameElement = document.querySelector('#username')
codeElement = document.querySelector('#code')
passwordElement = document.querySelector('#password')
passwordRepeatElement = document.querySelector('#password-repeat')
codeLabel = document.querySelector('#sc-label')
passwordLabel = document.querySelector('#pwd-label')
passwordRepeatLabel = document.querySelector('#pwdr-label')
submitButton = document.querySelector('#submit-button')


validate = ->
	submitButton.disabled = false

	if !codeElement.value.length
		codeLabel.innerHTML = 'No setup code'
		codeElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		codeLabel.innerHTML = ''
		codeElement.classList.remove('status-bad')

	if passwordElement.value.length < 8
		passwordElement.classList.add('status-bad')
		passwordLabel.innerHTML = 'Password is too short'
		submitButton.disabled = true
	else if passwordElement.value != passwordRepeatElement.value
		passwordElement.classList.add('status-bad')
		passwordRepeatElement.classList.add('status-bad')
		passwordLabel.innerHTML = 'Passwords do not match!'
		passwordRepeatLabel.innerHTML = 'Passwords do not match!'
		submitButton.disabled = true
	else
		passwordElement.classList.remove('status-bad')
		passwordRepeatElement.classList.remove('status-bad')
		passwordLabel.innerHTML = ''
		passwordRepeatLabel.innerHTML = ''


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)
	username = params.get('username')
	if username
		usernameElement.value = params.get('username')
	else
		window.location.href = '/console/login'

	validate()
)


formElement.addEventListener('submit', (e) ->
	e.preventDefault()
	res = await fetch('/console/verify-setup-code/'
		method: 'post'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			setupCode: codeElement.value
		)
	).catch(->
		alert('Could not check your code. Please check your internet connection.')
	)

	if not res.ok
		codeLabel.innerHTML = 'Wrong setup code'
		codeElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		formElement.submit()
)


addEventListener('input', validate)
