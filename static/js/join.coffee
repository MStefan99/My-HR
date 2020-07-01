'use strict';

iosRadio = document.querySelector('#team-i')

iosRadio.addEventListener('click', (e) ->
	if not confirm('You will need to have your own macOS device for iOS development.
		Do you wish to continue?')
		e.preventDefault();
)