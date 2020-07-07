'use strict';

titleElement = document.querySelector('#note-title')
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
		noteDeleteButton.addEventListener('click',->
			res = await fetch('/console/notes/',
				method: 'delete',
				headers:
					'Content-Type': 'application/json',
				body: JSON.stringify(
					id: note.id
				)
			)
			if not res.ok
				alert('Could not delete a note. Please check your internet connection.')
			else
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


update = ->
	oldNotes = document.querySelectorAll('#note-container .note')

	res = await fetch('/console/get-notes/')
	notes = await res.json()

	for oldNote in oldNotes
		remove(oldNote)

	for note in notes
		addNote(note)
	filter()


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
	window.scrollTo(0, document.body.offsetHeight)



addEventListener('load', ->
	await update()
	window.scrollTo(0, document.body.offsetHeight)
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


noteSubmitButton.addEventListener('click', ->
	filterType = if shared then 'shared' else 'private'

	res = await fetch('/console/notes/',
		method: 'post'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			shared: shared
			message: noteTextarea.value
		)
	)

	if not res.ok
		alert('Failed to save the note. Please check your internet connection.')
	else
		note = await res.json();
		addNote(note)
		filter()
)
