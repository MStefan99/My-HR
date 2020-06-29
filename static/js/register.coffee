usernameElement = document.querySelector('#username')
codeElement = document.querySelector('#code')
passwordElement = document.querySelector('#password')
passwordRepeatElement = document.querySelector('#password-repeat')

usernameLabel = document.querySelector('#u-label')
codeLabel = document.querySelector('#sc-label')
passwordLabel = document.querySelector('#pwd-label')
passwordRepeatLabel = document.querySelector('#pwdr-label')

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


[usernameElement,
	codeElement,
	passwordElement,
	passwordRepeatElement].forEach((element) ->
	'keyup paste'.split(' ').forEach((event) ->
		element.addEventListener(event, validate)
	)
)


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)
	usernameElement.value = params.get('username')

	validate()
)
