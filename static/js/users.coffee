usersTable = document.querySelector('#users-table')


addEventListener('load', ->
	res = await fetch('/console/get-users')
	users = await res.json()
	console.log(users)

	for user in users
		tableRow = document.createElement('tr')
		usersTable.appendChild(tableRow)

		usernameCell = document.createElement('td')
		usernameCell.innerHTML = user.username
		tableRow.appendChild(usernameCell)

		adminCell = document.createElement('td')
		adminCell.innerHTML = if user.admin then 'Yes' else 'No'
		tableRow.appendChild(adminCell)

		registeredCell = document.createElement('td')
		registeredCell.innerHTML = user.setupCode || '[Already setup]'
		tableRow.appendChild(registeredCell)

		otpCell = document.createElement('td')
		otpCell.innerHTML = if user.otpSetup then 'Yes' else 'No'
		tableRow.appendChild(otpCell)

		removeCell = document.createElement('td')
		tableRow.appendChild(removeCell)
		removeLink = document.createElement('a')
		removeLink.href = if user.username != 'admin' then '/console/users/remove/' + user.username else ''
		removeLink.innerHTML = 'Remove'
		removeCell.appendChild(removeLink)
)