'use strict';

firstNameInput = document.querySelector('#first-name')
lastNameInput = document.querySelector('#last-name')
backupEmailInput = document.querySelector('#backup-email')
phoneInput = document.querySelector('#phone')
backupPhoneInput = document.querySelector('#backup-phone')
cvInput = document.querySelector('#cv')
iosRadio = document.querySelector('#team-i')
submitButton = document.querySelector('#submit')

expired = false
requiredInputs = [firstNameInput, lastNameInput,
	backupEmailInput, phoneInput]



iosRadio.addEventListener('click', (e) ->
	if not confirm('You will need to have your own macOS device for iOS development.
		Do you wish to continue?')
		e.preventDefault();
)


setInterval(->
	if not expired and not document.cookie.match('SID')
		expired = true
		submitButton.disabled = true
		submitButton.title = 'Your link has expired'
		alert('Unfortunately, your link has expired. To submit the application,
			please return to the home page and get a new link.
			You may leave this page open.')
	else if expired and document.cookie.match('SID')
		expired = false
		submitButton.disabled = false
		submitButton.title = 'Send!'
, 1000)


validate = ->
	submitButton.disabled = false

	for input in requiredInputs
		if not input.value
			input.classList.add('status-bad')
			submitButton.disabled = true
		else
			input.classList.remove('status-bad')

	if not backupEmailInput.value.match(/\w+@\w+\.[a-z]{2,}/)
		backupEmailInput.classList.add('status-bad')
		submitButton.disabled = true
	else
		backupEmailInput.classList.remove('status-bad')

	if not phoneInput.value.match(/^(0|\+358)\d{9}$/)
		phoneInput.classList.add('status-bad')
		submitButton.disabled = true
	else
		phoneInput.classList.remove('status-bad')

	if not backupPhoneInput.value.match(/^(|((0|\+358)\d{9}))$/)
		backupPhoneInput.classList.add('status-bad')
		submitButton.disabled = true
	else
		backupPhoneInput.classList.remove('status-bad')


addEventListener('load', validate)
addEventListener('input', validate)
