'use strict';

table = document.querySelector('#feedback-table')


import {paginate} from '/js/console/pages.js'


remove = (element) ->
	element.parentNode.removeChild(element)


addEventListener('load', ->
	res = await fetch('/console/api/v0.1/feedback/').catch(->
		alert('Could not download feedback. Please check your internet connection.')
	)

	if res.status is 403
		alert('You have been signed out. Please sign in again to continue using My HR.')
	else
		feedbacks = await res.json()

		for feedback in feedbacks
			tableRow = document.createElement('tr')
			table.appendChild(tableRow)

			nameCell = document.createElement('td')
			nameCell.innerHTML = feedback.name || '[Not provided]'
			tableRow.appendChild(nameCell)

			emailCell = document.createElement('td')
			emailCell.innerHTML = feedback.email || '[Not provided]'
			tableRow.appendChild(emailCell)

			messageCell = document.createElement('td')
			messageCell.innerHTML = feedback.message
			tableRow.appendChild(messageCell)

		paginate()
)
