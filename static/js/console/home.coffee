'use strict';

Storage = window.localStorage;

import * as notify from '/js/console/notifications.js'


addEventListener('load', ->
	if Storage.getItem('mh_about-read') isnt 'true'
		if await notify.ask('Welcome!'
			'Hi, it\'s great to meet you!
			\nWelcome to My HR!
			\nWould you like to read a message from a developer?')
			Storage.setItem('mh_about-read', 'true')
			window.location.href = '/console/about'
			return
		else
			notify.tell('Thank you'
				'Thank you and have a nice day!')
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
			registration.sync.register('request-sync');
)
