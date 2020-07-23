'use strict';

searchForm = document.querySelector('#search-form')
searchInput = document.querySelector('#search-input')
searchSubmitButton = document.querySelector('#search-submit')

table = document.querySelector('#applications-table')
applicationCountElement = document.querySelector('#application-count')
applicationsHeader = document.querySelector('#applications-header')
tabElements = document.querySelectorAll('.tab')


import {paginate} from '/js/console/pages.js'

applications = []


remove = (element) ->
	element.parentNode.removeChild(element)


addApplication = (application) ->
	tableRow = document.createElement('tr')
	tableRow.classList.add('clickable', 'application', application.team.toLowerCase())
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

	tableRow


tabElements.forEach((e) ->
	e.addEventListener('click', ->
		team = e.id.replace('tab-', '')
		filterTeam(team);
	)
)


filterTeam = (team) ->
	updateTabs(team)
	if team isnt 'all' and team isnt 'embedded' and team isnt 'backend' \
		and team isnt 'frontend' and team isnt 'android' and team isnt 'ios'
		throw new Error('No such team')

	path = new URLSearchParams(window.location.search)
	path.set('team', team)
	window.history.replaceState({team: team}, 'Team filtered', '?' + path)

	for application in applications
		if application.team.toLowerCase().match(team) or team is 'all'
			application.row.classList.remove('team-hidden')
		else application.row.classList.add('team-hidden')

	paginate(
		filter: (row) ->
			not row.className.match('hidden')
	)


filterSearch = (query) ->
	path = new URLSearchParams(window.location.search)
	path.set('q', query)
	window.history.replaceState({q: query}, 'Search filtered', '?' + path)

	for application in applications
		if search(application, query)
			application.row.classList.remove('search-hidden')
		else application.row.classList.add('search-hidden')

	paginate(
		filter: (row) ->
			not row.className.match('hidden')
	)


search = (application, query) ->
	regex = query
		.split(' ')
		.map((word) -> '(?=.*' + word + ')')
		.join('')
	searchExp = new RegExp(regex, 'i')
	searchExp.test(application.firstName) or searchExp.test(application.lastName)\
		or searchExp.test(application.freeForm)


updateTabs = (team) ->
	tab = document.querySelector('#tab-' + team)
	tabElements.forEach((e) ->
		e.classList.remove('selected')
	)
	tab.classList.add('selected')


searchSubmitButton.addEventListener('click', ->
	if searchInput.value
		searchForm.submit()
)


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)
	path = '/console/api/v0.1/applications/?type=' + (params.get('type') || 'all')

	switch params.get('type')
		when null then title = 'All applications'
		when 'stars' then title = 'My stars'
		when 'accepted' then title = 'Accepted applications'
		when 'rejected' then title = 'Rejected applications'
		when 'pending' then title = 'Pending applications'
	if params.has('q')
		title = "Search results for '#{params.get('q')}'"
	applicationsHeader.innerHTML = title

	res = await fetch(path).catch(->
		alert('Could not download application list. Please check your internet connection.')
	)

	if res.status is 403
		alert('You have been signed out. Please sign in again to continue using My HR.')
	else
		applications = await res.json()

		applicationCountElement.innerHTML = "Total: #{applications.length} applications in all teams"
		for application in applications
			application.row = addApplication(application)

		paginate()
		filterTeam(params.get('team') || 'all', false)
		if params.has('q')
			filterSearch(params.get('q'))
)
