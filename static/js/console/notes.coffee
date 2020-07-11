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
applicationID = null


import {saveRequest} from '/js/console/main.js'


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
		noteElement.classList.add('my')

		noteDeleteButton = document.createElement('span')
		noteDeleteButton.classList.add('button')
		noteDeleteButton.innerHTML = 'Delete'
		noteDeleteButton.addEventListener('click', ->
			if confirm("Are you sure you want to delete the following note?
					\n\n\"#{note.message}\"")
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
				if res.ok
					remove(noteElement)
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
		noteSenderElement.innerHTML = "#{note.author} wrote at #{time.toLocaleString('en-GB')}:"


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


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)
	applicationID = params.get('id')

	res = await fetch('/console/api/v0.1/notes/' + if applicationID
	then "?applicationID=#{applicationID}" else '').catch(->
		alert('Could not get notes. Please check your internet connection.')
	)
	notes = await res.json()

	for note in notes
		addNote(note)
	filter()
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
		alert('Please enter a message')
	else
		init =
			method: 'post'
			headers:
				'Content-Type': 'application/json'
			body: JSON.stringify(
				shared: shared
				message: noteTextarea.value
				applicationID: applicationID
			)

		res = await fetch('/console/api/v0.1/notes/', init).catch(->
			saveRequest('/console/api/v0.1/notes/', init)
			noteTextarea.value = ''
			noteSubmitButton.classList.add('disabled')
		)

		if res.ok
			noteTextarea.value = ''
			noteSubmitButton.classList.add('disabled')
			note = await res.json();
			addNote(note)
			filter()
)
