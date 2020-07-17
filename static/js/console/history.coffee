versionTable = document.querySelector('#version-table')


import {paginate} from '/js/console/pages.js'


addVersion = (version) ->
	tableRow = document.createElement('tr')
	versionTable.appendChild(tableRow)

	versionCell = document.createElement('td')
	versionCell.innerHTML = version.version
	tableRow.appendChild(versionCell)

	versionLogCell = document.createElement('td')
	tableRow.appendChild(versionLogCell)

	for log in version.logs
		versionLogText = document.createElement('p')
		versionLogText.innerHTML = log
		versionLogCell.appendChild(versionLogText)


addEventListener('load', ->
	res = await fetch('/console/api/v0.1/versions').catch(->
		alert('Could not download version list. Please check your internet connection.')
	)

	if res.status is 403
		alert('You have been signed out. Please sign in again to continue using My HR.')
	else
		versions = await res.json()

		for version in versions
			addVersion(version)

		paginate(
			pageSize: 8
		)
)
