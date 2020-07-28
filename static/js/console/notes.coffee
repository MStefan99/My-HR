'use strict';

noteContainer = document.querySelector('#note-container')
privateButton = document.querySelector('#private-button')
sharedButton = document.querySelector('#shared-button')
noteTextarea = document.querySelector('#note-textarea')
noteSubmitButton = document.querySelector('#note-submit')

filterPrivateButton = document.querySelector('#filter-private')
filterSharedButton = document.querySelector('#filter-shared')
filterAllButton = document.querySelector('#filter-all')

shared = false
filterType = 'all'


Months = Object.freeze([
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
]);


import {saveRequest} from '/js/console/main.js'
import * as notify from '/js/console/notifications.js'


getPath = ->
	params = new URLSearchParams(window.location.search)
	applicationID = params.get('id')

	"/console/api/v0.1/#{if applicationID then \
	'applications/' + applicationID + '/' else ''}notes/"


remove = (element) ->
	element.parentNode.removeChild(element)


addNote = (note) ->
	noteElement = document.createElement('div')
	noteElement.classList.add('note')
	noteContainer.appendChild(noteElement)

	noteSenderElement = document.createElement('span')
	noteSenderElement.classList.add('sender')

	time = new Date(note.time)
	noteSenderElement.innerHTML = "I wrote at #{time.toLocaleString('en-GB')}:"
	noteElement.appendChild(noteSenderElement)

	noteMessageElement = document.createElement('p')
	noteMessageElement.innerText = note.message
	noteElement.appendChild(noteMessageElement)

	if note.my
		note.author = 'I'
		noteElement.classList.add('my')

		noteDeleteButton = document.createElement('span')
		noteDeleteButton.classList.add('button')
		noteDeleteButton.innerHTML = 'Delete'
		noteDeleteButton.addEventListener('click', ->
			if await notify.ask('Deleting note'
				"Are you sure you want to delete the following note?
				\n\"#{note.message}\""
				'warning')
				init =
					method: 'delete'
					headers:
						'Content-Type': 'application/json'
					body: JSON.stringify(
						id: note.id
					)
				res = await fetch('/console/api/v0.1/notes/', init).catch(->
					saveRequest('/console/api/v0.1/notes', init)
				)
				if res.status is 429
					notify.tell('Please wait'
						'You have submitted too many requests and
							need to wait to continue'
						'error')
				else if res.ok
					remove(noteElement)
					notify.tell('Note deleted'
						'Your note was successfully deleted')
		)
		noteElement.appendChild(noteDeleteButton)

		noteSharedText = document.createElement('span')
		noteSharedText.classList.add('access-mode')
		if note.shared
			noteElement.classList.add('shared')
			noteSharedText.innerHTML = 'Public'
		else
			noteElement.classList.add('private')
			noteSharedText.innerHTML = 'Private'
		noteElement.appendChild(noteSharedText)
	else
		noteElement.classList.add('shared')

	noteSenderElement.innerHTML = "#{note.author} wrote "
	now = new Date()
	if now.getMonth() isnt time.getMonth() or now.getDate() isnt time.getDate()
		noteSenderElement.innerHTML += "on #{Months[time.getMonth()]} #{time.getDate()} "
	if now.getFullYear() isnt time.getFullYear()
		noteSenderElement.innerHTML += "#{time.getFullYear()} "
	noteSenderElement.innerHTML += "at #{time.getHours()}:#{time.getMinutes().toString().padStart(2, '0')}"


filter = (type = filterType) ->
	if (type isnt 'all' and type isnt 'shared' and type isnt 'private')
		throw new Error('No such filter type')
	filterType = type

	filterAllButton.classList.remove('pressed')
	filterSharedButton.classList.remove('pressed')
	filterPrivateButton.classList.remove('pressed')

	notes = document.querySelectorAll('.note')
	notes.forEach((note) ->
		note.classList.remove('hidden')
	)

	switch type
		when 'all'
			filterAllButton.classList.add('pressed')
		when 'private'
			filterPrivateButton.classList.add('pressed')
			document.querySelectorAll('.note.shared').forEach((note) ->
				note.classList.add('hidden')
			)
		when 'shared'
			filterSharedButton.classList.add('pressed')
			document.querySelectorAll('.note.private').forEach((note) ->
				note.classList.add('hidden')
			)


privateButton.addEventListener('click', ->
	sharedButton.classList.remove('pressed')
	privateButton.classList.add('pressed')
	shared = false
)


sharedButton.addEventListener('click', ->
	privateButton.classList.remove('pressed')
	sharedButton.classList.add('pressed')
	shared = true
)


filterAllButton.addEventListener('click', ->
	filter('all')
)


filterPrivateButton.addEventListener('click', ->
	filter('private')
)


filterSharedButton.addEventListener('click', ->
	filter('shared')
)


'keyup change paste'.split(' ').forEach((event) ->
	noteTextarea.addEventListener(event, ->
		if not noteTextarea.value
			noteSubmitButton.classList.add('disabled')
		else
			noteSubmitButton.classList.remove('disabled')
	)
)


noteSubmitButton.addEventListener('click', ->
	filterType = if shared then 'shared' else 'private'

	if not noteTextarea.value
		notify.tell('Empty note'
			'Please enter a message'
			'error')
	else
		init =
			method: 'post'
			headers:
				'Content-Type': 'application/json'
			body: JSON.stringify(
				shared: shared
				message: noteTextarea.value
			)

		res = await fetch(getPath(), init).catch(->
			saveRequest(getPath(), init)
			noteTextarea.value = ''
			noteSubmitButton.classList.add('disabled')
		)

		if res.status is 429
			notify.tell('Please wait'
				'You have submitted too many requests and
					need to wait to continue'
				'error')
		else if res.ok
			noteTextarea.value = ''
			noteSubmitButton.classList.add('disabled')
			note = await res.json();
			addNote(note)
			filter()
			notify.tell('Note saved'
				'Your note was saved')
)


addEventListener('load', ->
	res = await fetch(getPath()).catch(->
		notify.tell('Download error'
			'Could not download notes. Please check your internet connection.'
			'error')
	)

	if res.status is 429
		notify.tell('Please wait'
			'You have submitted too many requests and
				need to wait to continue'
			'error')
	else if res.ok
		notes = await res.json()

		for note in notes
			addNote(note)
		filter()
)
