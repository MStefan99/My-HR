passwordElement = document.querySelector('#password')
passwordRepeatElement = document.querySelector('#password-repeat')
submitElement = document.querySelector('#submit')
passwordLabelElement = document.querySelector('#pwd-label')
passwordRepeatLabelElement = document.querySelector('#pwdr-label')


validate = ->
	submitElement.disabled = true

	if (passwordElement.value.length < 8)
		passwordElement.classList.add('status-bad')
		passwordLabelElement.classList.add('status-bad')
		passwordLabelElement.innerHTML = 'Password is too short'
	else if (passwordElement.value != passwordRepeatElement.value)
		[passwordElement, passwordRepeatElement, passwordLabelElement, passwordRepeatLabelElement].forEach((e) ->
			e.classList.add('status-bad');
		)
		[passwordLabelElement, passwordRepeatLabelElement].forEach((e) ->
			e.innerHTML = 'Passwords do not match!'
		)
	else
		[passwordElement, passwordRepeatElement, passwordLabelElement, passwordRepeatLabelElement].forEach((e) ->
			e.classList.remove('status-bad');
			e.classList.add('status-good');
		)
		[passwordLabelElement, passwordRepeatLabelElement].forEach((e) ->
			e.innerHTML = ''
		)
		submitElement.disabled = false


[passwordElement, passwordRepeatElement].forEach((element) ->
	'keyup keydown change paste'.split(' ').forEach((event) ->
		element.addEventListener(event, validate)
	)
)
