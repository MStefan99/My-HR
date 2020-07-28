versionTable = document.querySelector('#version-table')


import {paginate} from '/js/console/pages.js'
import * as notify from '/js/console/notifications.js'


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
		notify.tell('Download error'
			'Could not download version list. Please check your internet connection.'
			'error')
	)

	if res.status is 429
		notify.tell('Please wait'
			'You have submitted too many requests and
				need to wait to continue'
			'error')
	else if res.ok
		versions = await res.json()

		for version in versions
			addVersion(version)

		paginate(
			pageSize: 8
		)
)
