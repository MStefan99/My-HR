'use strict';

formElement = document.querySelector('form')

qrElement = document.querySelector('#qr')
secretElement = document.querySelector('#secret')
otpElement = document.querySelector('#otp')
otpLabel = document.querySelector('#otp-label')

submitButton = document.querySelector('#submit')


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
	res = await fetch('/console/get-otp/').catch(->
		alert('Could not download the 2FA code.
			Please check your internet connection.')
	)
	secret = await res.json()

	qrElement.setAttribute('src', secret.qr)
	secretElement.innerHTML = secret.secret
	secretLabel = document.createElement('input')
	secretLabel.type = 'hidden'
	secretLabel.name = 'secret'
	secretLabel.value = secret.secret
	formElement.appendChild(secretLabel)

	validate()
)


addEventListener('keyup', validate)
setInterval(validate, 1000)
