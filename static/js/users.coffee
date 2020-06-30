usersTable = document.querySelector('#users-table')
usernameInput = document.querySelector('#username')
userAdminCheckbox = document.querySelector('#admin')
submitButton = document.querySelector('#submit')


addEventListener('load', ->
	update()
)


remove = (element) ->
	element.parentNode.removeChild(element)


clear = ->
	tableRows = document.querySelectorAll('#users-table tr')

	if tableRows?
		for row in tableRows
			remove(row)


update = ->
	clear()

	res = await fetch('/console/get-users/')
	users = await res.json()

	for user in users
		do (user) ->
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
			removeLink = document.createElement('a')
			removeLink.href = 'javascript:'
			removeCell.appendChild(removeLink)
			removeLink.innerHTML = 'Remove'
			if user.username != 'admin'
				removeLink.addEventListener('click', ->
					if confirm("If you continue,
							user \"#{user.username}\" will be deleted.
							\nAre you sure you want to continue?")
						await fetch("/console/users/?username=#{user.username}", {
							method: 'delete'
						});
						update()
				)


submitButton.addEventListener('click', ->
	username = usernameInput.value
	admin = userAdminCheckbox.checked

	await fetch("/console/users/?username=#{username}&admin=#{admin}", {
		method: 'post'
	});
	update()
)