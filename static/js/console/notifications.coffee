main = document.querySelector('main')
notificationContainer = document.querySelector('#notification-container')


if not notificationContainer
	notificationContainer = document.createElement('div')
	notificationContainer.id = 'notification-container'
	main.appendChild(notificationContainer)


remove = (element, delay = 0) ->
	if element and element.parentNode
		setTimeout(->
			element.parentNode.removeChild(element)
		, delay)


close = (notificationElement) ->
	notificationElement.classList.add('inactive')
	remove(notificationElement, 500)


export tell = (title, message, type = 'ok', timeout = 5000) ->
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
			close(notificationElement)
			resolve()
		)
		if timeout > 0
			setTimeout(->
				close(notificationElement)
				resolve()
			, timeout)
	)


export ask = (title, message, type = 'ok', timeout = 10000) ->
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
			resolve(true)
			close(notificationElement)
		)

		rejectElement.addEventListener('click', ->
			resolve(false)
			close(notificationElement)
		)

		if timeout > 0
			setTimeout(->
				close(notificationElement)
				resolve(false)
			, timeout)
	)
