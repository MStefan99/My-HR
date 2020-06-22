applicationsTable = document.querySelector('#applications-table')


remove = (element) ->
	element.parentNode.removeChild(element)


addEventListener('load', ->
	update()
)


update = ->
	applicationRows = document.querySelectorAll('#applications-table tr')

	for row in applicationRows
		remove(row)

	res = await fetch('/applications')
	applications = await res.json()

	for application in applications
		do (application) ->
			tableRow = document.createElement('tr')
			applicationsTable.appendChild(tableRow)

			emailCell = document.createElement('td')
			tableRow.appendChild(emailCell)
			emailCell.innerHTML = application.backupEmail

			phoneCell = document.createElement('td')
			tableRow.appendChild(phoneCell)
			phoneCell.innerHTML = application.phone

			cvCell = document.createElement('td')
			tableRow.appendChild(cvCell)
			cvLink = document.createElement('a')
			cvCell.appendChild(cvLink)
			cvLink.href = '/download/' + application.filePath
			cvLink.innerHTML = application.fileName

			removeCell = document.createElement('td')
			tableRow.appendChild(removeCell)
			removeLink = document.createElement('span')
			removeCell.appendChild(removeLink)

			if application.accepted isnt 1
				removeLink.innerHTML = 'Remove'
				removeLink.classList.add('clickable')
				removeLink.addEventListener('click', ->
					await fetch('/applications/' + application.id, {
						method: 'delete'
					})
					update()
					alert('Your application was successfully deleted')
				)
			else
				removeLink.innerHTML = 'Accepted'
