'use strict';

formElement = document.querySelector('form')
secretInput = document.querySelector('#secret')
otpElement = document.querySelector('#otp')
otpLabel = document.querySelector('#otp-label')
submitButton = document.querySelector('#submit-button')


validate = ->
	submitButton.disabled = false

	if not otpElement.value.match(/^\d{6}$/)
		otpLabel.innerHTML = 'Wrong format'
		otpElement.classList.add('status-bad')
		submitButton.disabled = true
	else
		otpLabel.innerHTML = ''
		otpElement.classList.remove('status-bad')


formElement.addEventListener('submit', (e) ->
	e.preventDefault()
	res = await fetch('/console/api/v0.1/verify-otp/'
		method: 'post'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			secret: secretInput.value
			token: otpElement.value
		)
	).catch(->
		alert('Could not check your code. Please check your internet connection.')
	)

	if res.status is 429
		value = submitButton.value
		submitButton.disabled = true
		submitButton.value = 'Too many attempts'
		setTimeout(->
			submitButton.disabled = false
			submitButton.value = value
		, 10000)
	else if not res.ok
		switch await res.text()
			when 'WRONG_CODE'
				otpLabel.innerHTML = 'Wrong code'
				otpElement.classList.add('status-bad')
				submitButton.disabled = true
	else
		formElement.submit()
)


(->
	validate()
)()
addEventListener('input', validate)
