'use strict';

table = document.querySelector('#feedback-table')


import {paginate} from '/js/console/pages.js'
import * as notify from '/js/console/notifications.js'


remove = (element) ->
	element.parentNode.removeChild(element)


addEventListener('load', ->
	res = await fetch('/console/api/v0.1/feedback/').catch(->
		notify.tell('Download error'
			'Could not download feedback. Please check your internet connection.'
			'error')
	)

	if res.status is 429
		notify.tell('Please wait'
			'You have submitted too many requests and
				need to wait to continue'
			'error')
	else if res.ok
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
