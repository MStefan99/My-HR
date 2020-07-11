Storage = window.localStorage;
body = document.querySelector('body')


export saveRequest = (path, init) ->
	if 'serviceWorker' of navigator and await navigator.serviceWorker.getRegistration()
		alert('You are currently offline
			but we will retry this when you have connection again.')
		indexedDB.open('my-hr').onsuccess = ((e) ->
			db = e.target.result;
			db.transaction('unfinishedRequests', 'readwrite')
				.objectStore('unfinishedRequests')
				.add(
					path: path
					init: init
			)
		)
	else
		alert('You are not currently connected to internet. Please retry when online.')


if Storage.getItem('mh_theme') is 'dark'
	body.classList.add('dark-theme')


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


