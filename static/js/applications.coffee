table = document.querySelector('#applications-table')
applicationsHeader = document.querySelector('#applications-header')


remove = (element) ->
	element.parentNode.removeChild(element)


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)
	path = '/console/get-applications/?type=' + (params.get('type') || 'all')

	switch (params.get('type'))
		when null then title = 'All applications'
		when 'stars' then title = 'Your stars'
		when 'accepted' then title = 'Accepted applications'
		when 'rejected' then title = 'Rejected applications'
		when 'pending' then title = 'Pending applications'
	applicationsHeader.innerHTML = title

	res = await fetch(path);
	applications = await res.json();

	oldCells = document.querySelectorAll('td')
	if (oldCells.length > 0)
		for cell in oldCells
			remove(cell)

	for application in applications
		tableRow = document.createElement('tr')
		table.appendChild(tableRow)

		statusCell = document.createElement('td')
		tableRow.appendChild(statusCell)

		firstNameCell = document.createElement('td')
		firstNameCell.innerHTML = application.firstName
		tableRow.appendChild(firstNameCell)

		lastNameCell = document.createElement('td')
		lastNameCell.innerHTML = application.lastName
		tableRow.appendChild(lastNameCell)

		teamCell = document.createElement('td')
		teamCell.innerHTML = application.team
		tableRow.appendChild(teamCell)

		freeFormCell = document.createElement('td')
		if application.freeForm.length > 200
			text = application.freeForm.substr(0, 200) + '...'
		else
			text = application.freeForm
		freeFormCell.innerHTML = text || '[No info]'
		tableRow.appendChild(freeFormCell)

		openCell = document.createElement('td')
		openLink = document.createElement('a')
		openLink.innerHTML = 'Open'
		openLink.href = '/console/applications/' + application.id
		tableRow.appendChild(openCell)
		openCell.appendChild(openLink)
)