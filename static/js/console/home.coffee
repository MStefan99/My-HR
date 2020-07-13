'use strict';

Storage = window.localStorage;


addEventListener('load', ->
	versionElement = document.querySelector('meta[name="version"]')
	version = versionElement.content

	if Storage.getItem('mh_about-read') isnt 'true'
		if confirm('Hi, it\'s great to meet you!
				\nWelcome to My HR!
				\nWould you like to read a message from a developer?')
			Storage.setItem('mh_about-read', 'true')
			window.location.href = '/console/about'
			return
		else
			alert('Thank you and have a nice day!')

	if version isnt Storage.getItem('mh_last-version')
		Storage.setItem('mh_last-version', version)

		if confirm("My HR has been updated to version #{version}!
				\nWould you like to know what's new?
				\nYou can always view version history
				by clicking the version number at the bottom of the page.")
			window.location.href = '/console/versions/'
			return
)
