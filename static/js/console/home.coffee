'use strict';

Storage = window.localStorage;


addEventListener('load', ->
	if Storage.getItem('mh_about-read') isnt 'true'
		if confirm('Hi, it\'s great to meet you!
				\nWelcome to My HR!
				\nWould you like to read a message from a developer?')
			Storage.setItem('mh_about-read', 'true')
			window.location.href = '/console/about'
			return
		else
			alert('Thank you and have a nice day!')
)


addEventListener('load', ->
	req = indexedDB.open('my-hr', 1)
	req.onupgradeneeded = (e) ->
		db = e.target.result
		db.createObjectStore('unfinishedRequests'
			autoIncrement: true)

	if 'serviceWorker' of navigator
		registration = await navigator.serviceWorker.register('/js/console/worker.js'
			scope: '/console/'
		)
		await navigator.serviceWorker.ready;
		if 'sync' of registration
			registration.sync.register('sync');
)
