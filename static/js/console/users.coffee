'use strict';

formElement = document.querySelector('form')
usersTable = document.querySelector('#users-table')
usernameInput = document.querySelector('#username')
userAdminCheckbox = document.querySelector('#admin')


import {saveRequest} from '/js/console/main.js'


remove = (element) ->
	element.parentNode.removeChild(element)


addUser = (user) ->
	tableRow = document.createElement('tr')
	usersTable.appendChild(tableRow)

	usernameCell = document.createElement('td')
	usernameCell.innerHTML = user.username
	tableRow.appendChild(usernameCell)

	adminCell = document.createElement('td')
	adminCell.innerHTML = if user.admin then 'Yes' else 'No'
	tableRow.appendChild(adminCell)

	registeredCell = document.createElement('td')
	registeredCell.innerHTML = user.setupCode || '[Already set up]'
	tableRow.appendChild(registeredCell)

	otpCell = document.createElement('td')
	otpCell.innerHTML = if user.otpSetup then 'Yes' else 'No'
	tableRow.appendChild(otpCell)

	removeCell = document.createElement('td')
	tableRow.appendChild(removeCell)
	removeLink = document.createElement('span')
	removeLink.classList.add('clickable')
	removeCell.appendChild(removeLink)
	removeLink.innerHTML = 'Remove'
	if user.username isnt 'admin' and user.username isnt 'System'
		removeLink.addEventListener('click', ->
			if confirm("If you continue,
							user \"#{user.username}\" will be deleted.
							\nAre you sure you want to continue?")
				init =
					method: 'delete'
					headers:
						'Content-Type': 'application/json'
					body: JSON.stringify(
						username: user.username
					)
				res = await fetch('/console/api/v0.1/users/', init).catch(->
					saveRequest('/console/api/v0.1/users/', init)
				)
				if not res.ok
					if await res.text() is 'CANNOT_DELETE_ADMIN'
						alert('You cannot delete this user
							since it is required for proper system operation')
					else
						alert('An error occurred while removing a user.
							Please check your internet connection and try again.')
				else
					remove(tableRow)
		)


addEventListener('load', ->
	res = await fetch('/console/api/v0.1/users/').catch(->
		alert('Could not download the user list.
			Please check your internet connection.')
	)
	users = await res.json()

	for user in users
		addUser(user)
)


formElement.addEventListener('submit', (e) ->
	e.preventDefault();
	username = usernameInput.value
	admin = userAdminCheckbox.checked

	init =
		method: 'post'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			username: username
			admin: admin
		)
	res = await fetch('/console/api/v0.1/users/', init).catch(->
		saveRequest('/console/api/v0.1/users/', init)
	)

	if not res.ok
		if await res.text() is 'DUPLICATE_USERNAME'
			alert('User with such username already exists,
				please choose another or delete that user.')
		else
			alert('An error occurred while adding a user.
				Please check your internet connection and try again.')
	else
		addUser(await res.json())
)
