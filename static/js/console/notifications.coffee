main = document.querySelector('main')
notificationContainer = document.querySelector('#notification-container')


if not notificationContainer
	notificationContainer = document.createElement('div')
	notificationContainer.id = 'notification-container'
	main.appendChild(notificationContainer)


remove = (element, delay = 0) ->
	setTimeout(->
		element.parentNode.removeChild(element)
	, delay)


export tell = (title, message, type = 'ok') ->
	if type isnt 'ok' and type isnt 'warning' and type isnt 'error'
		throw new Error('No such notification type')

	notificationElement = document.createElement('div')
	notificationElement.classList.add('notification', 'inactive', type)
	setTimeout(->
		notificationElement.classList.remove('inactive')
	, 10
	)

	closeElement = document.createElement('span')
	closeElement.classList.add('icon', 'close-icon', 'clickable')
	notificationElement.appendChild(closeElement)

	titleElement = document.createElement('h2')
	titleElement.innerText = title
	notificationElement.appendChild(titleElement)

	messageElement = document.createElement('p')
	messageElement.innerText = message
	notificationElement.appendChild(messageElement)
	notificationContainer.appendChild(notificationElement)

	new Promise((resolve, reject) ->
		closeElement.addEventListener('click', ->
			resolve('Notification closed by user')
			notificationElement.classList.add('inactive')
			remove(notificationElement, 500)
		)
	)


export ask = (title, message, type = 'ok') ->
	if type isnt 'ok' and type isnt 'warning' and type isnt 'error'
		throw new Error('No such notification type')

	notificationElement = document.createElement('div')
	notificationElement.classList.add('notification', 'inactive', type)
	setTimeout(->
		notificationElement.classList.remove('inactive')
	, 10
	)

	titleElement = document.createElement('h2')
	titleElement.innerText = title
	notificationElement.appendChild(titleElement)

	messageElement = document.createElement('p')
	messageElement.innerText = message
	notificationElement.appendChild(messageElement)

	confirmElement = document.createElement('span')
	confirmElement.classList.add('button', 'primary', 'clickable')
	confirmElement.innerText = 'Yes'
	notificationElement.appendChild(confirmElement)

	rejectElement = document.createElement('span')
	rejectElement.classList.add('button', 'secondary', 'clickable')
	rejectElement.innerText = 'No'
	notificationElement.appendChild(rejectElement)
	notificationContainer.appendChild(notificationElement)

	new Promise((resolve, reject) ->
		confirmElement.addEventListener('click', ->
			resolve('User confirmation received')
			notificationElement.classList.add('inactive')
			remove(notificationElement, 500)
		)
		rejectElement.addEventListener('click', ->
			reject('User rejected the notification')
			notificationElement.classList.add('inactive')
			remove(notificationElement, 500)
		)
	)
