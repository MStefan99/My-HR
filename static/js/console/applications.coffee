'use strict';

table = document.querySelector('#applications-table')
applicationCountElement = document.querySelector('#application-count')
applicationsHeader = document.querySelector('#applications-header')
tabElements = document.querySelectorAll('.tab')


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

	res = await fetch(path).catch(->
		alert('Could not download application list. Please check your internet connection.')
	)
	applications = await res.json()

	oldCells = document.querySelectorAll('td')
	if (oldCells.length > 0)
		for cell in oldCells
			remove(cell)

	applicationCountElement.innerHTML = "Total: #{applications.length} applications in all teams"
	for application in applications
		do (application) ->
			tableRow = document.createElement('tr')
			tableRow.classList.add('clickable', 'application-' + application.team.toLowerCase())
			tableRow.onclick = ->
				window.location = '/console/application/?id=' + application.id
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

	filter(params.get('team') || 'all', false)
)


addEventListener('popstate', (e) ->
	if history.state
		team = history.state.team
	else 
		team = 'all'
	filter(team, false)
)


tabElements.forEach((e) ->
	e.addEventListener('click', ->
		team = e.id.replace('tab-', '')
		filter(team);
	)
)


filter = (team, save=true) ->
	updateTabs(team)
	if team isnt 'all' and team isnt 'embedded' and team isnt 'backend' \
		and team isnt 'frontend' and team isnt 'android' and team isnt 'ios'
		throw new Error('No such team')

	if save
		path = new URLSearchParams(window.location.search)
		path.set('team', team)
		window.history.pushState({team: team}, 'Team filtered', '?' + path)

	tableRows = document.querySelectorAll('tbody tr')
	for row in tableRows
		if row.className.match(team) or team is 'all'
			row.classList.remove('hidden')
		else row.classList.add('hidden')


updateTabs = (team) ->
	tab = document.querySelector('#tab-' + team)
	tabElements.forEach((e) ->
		e.classList.remove('selected')
	)
	tab.classList.add('selected')
