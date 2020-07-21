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

	resetCell = document.createElement('td')
	tableRow.appendChild(resetCell)
	resetLink = document.createElement('span')
	resetCell.appendChild(resetLink)
	resetLink.classList.add('clickable')
	resetLink.tabIndex = 0
	resetLink.innerHTML = 'Reset'
	if user.username isnt 'System'
		resetLink.addEventListener('click', ->
			if confirm("You are about to reset user #{user.username}.
							\nAre you sure you want to continue?")
				resetOTP = confirm('Do you also want to reset the 2FA?')
				init =
					method: 'PATCH'
					headers:
						'Content-Type': 'application/json'
					body: JSON.stringify(
						username: user.username
						resetPassword: true
						resetOTP: resetOTP
					)
				res = await fetch('/console/api/v0.1/users/', init).catch(->
					saveRequest('/console/api/v0.1/users/', init)
				)
				if not res.ok
					if await res.text() is 'CANNOT_RESET_SYSTEM'
						alert('You cannot reset this user account
							since it is required for proper system operation')
					else
						alert('An error occurred while removing a user.
							Please check your internet connection and try again.')
				else
					updatedUser = await res.json()
					registeredCell.innerHTML = updatedUser.setupCode
					if resetOTP
						otpCell.innerHTML = 'No'
		)

	removeCell = document.createElement('td')
	tableRow.appendChild(removeCell)
	removeLink = document.createElement('span')
	removeLink.classList.add('clickable')
	removeLink.tabIndex = 0
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
						alert('You cannot delete this user account
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

	if res.status is 403
		alert('You have been signed out. Please sign in again to continue using My HR.')
	else
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
