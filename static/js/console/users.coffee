'use strict';

formElement = document.querySelector('form')
usersTable = document.querySelector('#users-table')
usernameInput = document.querySelector('#username')
userAdminCheckbox = document.querySelector('#admin')


import {saveRequest} from '/js/console/main.js'
import * as notify from '/js/console/notifications.js'


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
	resetLink.innerHTML = 'Reset'
	if user.username isnt 'System'
		resetLink.addEventListener('click', ->
			if await notify.ask('Resetting user'
				"You are about to reset user #{user.username}.
					\nAre you sure you want to continue?"
				'warning')
				resetOTP = await notify.ask('2FA reset'
					'Do you also want to reset the 2FA?'
					'warning')
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
						notify.tell('System account'
							'You cannot reset this user account
							since it is required for proper system operation'
							'error')
				else
					updatedUser = await res.json()
					registeredCell.innerHTML = updatedUser.setupCode
					if resetOTP
						otpCell.innerHTML = 'No'
					notify.tell('Reset complete'
						'User can now create a new password')
		)

	removeCell = document.createElement('td')
	tableRow.appendChild(removeCell)
	removeLink = document.createElement('span')
	removeLink.classList.add('clickable')
	removeCell.appendChild(removeLink)
	removeLink.innerHTML = 'Remove'
	if user.username isnt 'admin' and user.username isnt 'System'
		removeLink.addEventListener('click', ->
			if await notify.ask('Deleting user'
				"If you continue,
					user \"#{user.username}\" will be deleted.
					\nAre you sure you want to continue?"
				'warning')
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
						notify.tell('System account'
							'You cannot delete this user account
							since it is required for proper system operation'
							'error')
				else
					remove(tableRow)
					notify.tell('User deleted'
						'User was successfully deleted')
		)


addEventListener('load', ->
	res = await fetch('/console/api/v0.1/users/').catch(->
		notify.tell('Download error'
			'Could not download the user list.
			Please check your internet connection.'
			'error')
	)

	if res.ok
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
			notify.tell('Duplicate username'
				'User with such username already exists
				please choose another or delete that user.'
				'error')
	else
		addUser(await res.json())
		notify.tell('User added'
			'User was successfully added')
)
