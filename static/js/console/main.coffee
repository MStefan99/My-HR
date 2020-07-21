body = document.querySelector('body')
searchIcon = document.querySelector('#search-icon')
searchInput = document.querySelector('#search-input')

Storage = window.localStorage


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


(->
	if Storage.getItem('mh_theme') is 'dark'
		body.classList.add('dark-theme')

	res = await fetch('/console/api/v0.1/auth/');
	if not res.ok
		window.location.href = '/console/login/'
)()


searchIcon.addEventListener('click', (e) ->
	e.stopPropagation()
	searchInput.classList.add('shown')
)


searchInput.addEventListener('click', (e) ->
	e.stopPropagation()
)


body.addEventListener('click', ->
	searchInput.classList.remove('shown')
)
