table = document.querySelector('#applications-table')
applicationsHeader = document.querySelector('#applications-header')


remove = (element) ->
	element.parentNode.removeChild(element)


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)
	path = '/console/get-applications/?type=' + (params.get('type') || 'all')

	switch params.get('type')
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
		do (application) ->
			tableRow = document.createElement('tr')
			tableRow.classList.add('clickable')
			tableRow.onclick = ->
				window.location = '/console/applications/' + application.id
			table.appendChild(tableRow)

			statusCell = document.createElement('td')
			tableIcon = document.createElement('img')
			statusCell.appendChild(tableIcon)
			tableIcon.classList.add('icon', 'center')
			switch application.accepted
				when 0 then tableIcon.src = '/img/progress.svg'
				when 1 then tableIcon.src = '/img/checkmark.svg'
				when -1 then tableIcon.src = '/img/cross.svg'
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
)