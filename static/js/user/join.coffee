'use strict';

iosRadio = document.querySelector('#team-i')
submitButton = document.querySelector('#submit')

expired = false

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
1000)
