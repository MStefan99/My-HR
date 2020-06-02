table = document.querySelector('#applications-table')


remove = (element) ->
	element.parentNode.removeChild(element)


addEventListener('load', ->
	res = await fetch('/console/applications/');
	applications = await res.json();

	oldCells = document.querySelectorAll('td')
	if (oldCells.length > 0)
		for cell in oldCells
			remove(cell)

	for application in applications
		tableRow = document.createElement('tr')
		table.appendChild(tableRow)

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
		openLink.href = '/console/application/' + application.id
		tableRow.appendChild(openCell)
		openCell.appendChild(openLink)
)