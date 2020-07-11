'use strict';

formElement = document.querySelector('form')
qrElement = document.querySelector('#qr')
secretLabel = document.querySelector('#secret')
otpElement = document.querySelector('#otp')
otpLabel = document.querySelector('#otp-label')
submitButton = document.querySelector('#submit-button')

secret = null


validate = ->
	submitButton.disabled = false

	if not otpElement.value.match(/^\d{6}$/)
		otpLabel.innerHTML = 'Wrong format'
		otpElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		otpLabel.innerHTML = ''
		otpElement.classList.remove('status-bad')



addEventListener('load', ->
	res = await fetch('/console/api/v0.1/otp/').catch(->
		alert('Could not download the 2FA code.
			Please check your internet connection.')
	)
	secretObj = await res.json()

	qrElement.setAttribute('src', secretObj.qr)
	secretLabel.innerHTML = secret = secretObj.secret

	secretInput = document.createElement('input')
	secretInput.type = 'hidden'
	secretInput.name = 'secret'
	secretInput.value = secret
	formElement.appendChild(secretInput)

	validate()
)


formElement.addEventListener('submit', (e) ->
	e.preventDefault()
	res = await fetch('/console/api/v0.1/verify-otp/'
		method: 'post'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			secret: secret
			token: otpElement.value
		)
	).catch(->
		alert('Could not check your code. Please check your internet connection.')
	)

	if not await res.ok
		otpLabel.innerHTML = 'Wrong code'
		otpElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		formElement.submit()
)


addEventListener('load', validate)
addEventListener('input', validate)
