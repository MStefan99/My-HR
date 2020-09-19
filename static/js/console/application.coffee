'use strict';

starText = document.querySelector('#star-text')
starIcon = document.querySelector('#star-icon')
statusIcon = document.querySelector('#status-icon')
starButton = document.querySelector('#star-button')
shareButton = document.querySelector('#share-button')
desktopButton = document.querySelector('#desktop-button')
acceptButton = document.querySelector('#accept-button')
rejectButton = document.querySelector('#reject-button')

acceptedBadge = document.querySelector('#accepted-badge')
rejectedBadge = document.querySelector('#rejected-badge')

firstNameElement = document.querySelector('#first-name')
lastNameElement = document.querySelector('#last-name')
teamElement = document.querySelector('#team')
emailElement = document.querySelector('#email')
backupEmailElement = document.querySelector('#backup-email')
phoneElement = document.querySelector('#phone')
backupPhoneElement = document.querySelector('#backup-phone')
linksElement = document.querySelector('#links')
freeFormElement = document.querySelector('#free-form')
fileDownloadLink = document.querySelector('#cv-download')
fileViewLink = document.querySelector('#cv-view')

application = {}
Storage = window.localStorage


import {saveRequest} from '/js/console/main.js'
import * as notify from '/js/console/notifications.js'


getBasePath = -> '/console/api/v0.1/applications/' + application.id


remove = (element) ->
	element.parentNode.removeChild(element)


propose = (status) ->
	if await notify.ask('Make a proposal'
		"Are you sure you want to #{if status is 1 then 'accept' else 'reject'}
			#{firstNameElement.innerHTML}\'s application?"
		'warning')
		init =
			method: 'post'
			headers:
				'Content-Type': 'application/json'
			body: JSON.stringify(
				status: status
			)
		res = await fetch(getBasePath() + '/proposals/', init).catch(->
			saveRequest(getBasePath() + '/proposals/', init)
		)

		if res.status is 429
			notify.tell('Please wait'
				'You need to wait before submitting another proposal'
				'error')
		else if res.ok
			switch await res.text()
				when 'NO_APPLICATION'
					notify.tell('Not found'
						'The application was not found. It may have been deleted or the URL is wrong.'
						'error')
				when 'INVALID_STATUS'
					notify.tell('Error'
						'Your proposal could not be processed due to the internal error.
							Please contact the support.'
						'error')
				when 'ALREADY_ACCEPTED'
					notify.tell('Already accepted'
						'This application was already accepted, you cannot change its status anymore.'
						'error')
				when 'ALREADY_REJECTED'
					notify.tell('Already rejected'
						'This application was already rejected, you cannot change its status anymore.'
						'error')
				when 'ALREADY_EXISTS'
					notify.tell('Already proposed'
						'You have already made a proposal for this application. Please take it back first.'
						'error')
				when 'ACCEPTED'
					application.accepted = 1
				when 'REJECTED'
					application.accepted = -1
				when 'Created'
					switch status
						when 1 then application.proposals.accepted = application.proposals.accepted + 1 || 1
						when -1 then application.proposals.rejected = application.proposals.rejected + 1 || 1
					application.proposals.my = status
					notify.tell('Proposal saved', 'Your proposal was saved')
					updateStatus()
					setBadges()


deleteProposal = ->
	if await notify.ask('Cancel proposal'
		'Are you sure you want to take your proposal back?'
		'warning')
		init =
			method: 'delete'
			headers:
				'Content-Type': 'application/json'
		res = await fetch(getBasePath() + '/proposals/', init).catch(->
			saveRequest(getBasePath() + '/proposals/', init)
		)

		if res.status is 429
			notify.tell('Please wait'
				'You need to wait before removing your proposal'
				'error')
		else if res.ok
			switch await res.text()
				when 'ALREADY_ACCEPTED'
					notify.tell('Already accepted'
						'This application was already accepted, you cannot change its status anymore.'
						'error')
				when 'ALREADY_REJECTED'
					notify.tell('Already rejected'
						'This application was already rejected, you cannot change its status anymore.'
						'error')
				when 'OK'
					switch application.proposals.my
						when 1 then application.proposals.accepted -= 1
						when -1 then application.proposals.rejected -= 1
					application.proposals.my = null
					notify.tell('Proposal deleted', 'Your proposal was deleted')
					updateStatus()
					setBadges()


setBadges = () ->
	acceptedBadge.innerHTML = "#{application.proposals.accepted || 0}\
	/#{application.proposals.needed}"
	rejectedBadge.innerHTML = "#{application.proposals.rejected || 0}\
	/#{application.proposals.needed}"


setListeners = () ->
	desktopButton.addEventListener('click', ->
		Storage.setItem('desktop_autorun', JSON.stringify(
			src: window.location.pathname + window.location.search
			name: application.firstName + '\'s application'
			img: '/img/application.svg'
		))
		window.location.href = '/console/desktop/'
	)

	shareButton.addEventListener('click', ->
		if navigator.clipboard?
			await navigator.clipboard.writeText(window.location.href)
			notify.tell('Copied'
				'Link copied to clipboard!')
		else
			notify.tell('Error'
				'Unfortunately, we can\'t copy the link on your device.
				Please copy the link from the address bar manually.'
				'error')
	)


setData = () ->
	firstNameElement.innerHTML = application.firstName
	lastNameElement.innerHTML = application.lastName
	teamElement.innerHTML = application.team
	emailElement.innerHTML = application.email
	emailElement.href = 'mailto:' + application.email
	backupEmailElement.innerHTML = application.backupEmail
	backupEmailElement.href = 'mailto:' + application.backupEmail
	phoneElement.innerHTML = application.phone
	phoneElement.href = 'tel:' + application.phone
	if application.backupPhone
		backupPhoneElement.innerHTML = application.backupPhone
		backupPhoneElement.href = 'tel:' + application.backupPhone
	else
		backupPhoneElement.innerHTML = '[Not provided]'
	links = application.links.replace(/(http:\/\/|https:\/\/)?(\S*?\.\S*)/g
		'<a href="https://$2" target="_blank">$&</a>')
	linksElement.innerHTML = links or '[Empty]'
	freeFormElement.innerHTML = application.freeForm or '[Empty]'
	fileDownloadLink.href = '/console/file/' + application.filePath
	fileViewLink.href = '/console/view_file/' + application.filePath


setupApplication = ->
	document.title = application.firstName + '\'s application - My HR'
	statusIcon.alt = 'Status icon'

	updateStar()
	setBadges()
	setListeners()
	setData()
	updateStatus()


updateStar = ->
	if application.starred
		starIcon.src = '/img/star-active.svg'
		starText.innerHTML = 'Unstar'
		starButton.onclick = unstar

	else
		starIcon.src = '/img/star-inactive.svg'
		starText.innerHTML = 'Star'
		starButton.onclick = star


updateStatus = ->
	if application.accepted
		remove(acceptButton)
		remove(rejectButton)
		switch application.accepted
			when 1 then statusIcon.src = '/img/checkmark.svg'
			when -1 then statusIcon.src = '/img/cross.svg'
	else
		statusIcon.src = '/img/progress.svg'
		switch application.proposals.my
			when 1
				acceptButton.classList.add('pressed')
				rejectButton.classList.add('disabled')
				acceptButton.title = 'Take back your proposal'
				rejectButton.title = 'You have already proposed to accept this application'
				acceptButton.onclick = deleteProposal
			when -1, -2
				acceptButton.classList.add('disabled')
				rejectButton.classList.add('pressed')
				acceptButton.title = 'You have already proposed to reject this application'
				rejectButton.title = 'Take back your proposal'
				rejectButton.onclick = deleteProposal
			else
				acceptButton.classList.remove('pressed', 'disabled')
				rejectButton.classList.remove('pressed', 'disabled')
				acceptButton.title = 'Accept this application'
				rejectButton.title = 'Reject this application'
				acceptButton.onclick = -> propose(1)
				rejectButton.onclick = -> propose(-1)


star = ->
	init =
		method: 'post'
		headers:
			'Content-Type': 'application/json'
	res = await fetch(getBasePath() + '/stars/', init).catch(->
		saveRequest(getBasePath() + '/stars/', init)
	)

	if res.status is 429
		notify.tell('Please wait'
			'You have submitted too many requests and
				need to wait to continue'
			'error')
	else if res.ok
		application.starred = true
		updateStar()
		notify.tell('Starred',
			'You can now find this application in the "stars" section')


unstar = ->
	init =
		method: 'delete'
		headers:
			'Content-Type': 'application/json'
	res = await fetch(getBasePath() + '/stars/', init).catch(->
		saveRequest(getBasePath() + '/stars/', init)
	)

	if res.status is 429
		notify.tell('Please wait'
			'You have submitted too many requests and
				need to wait to continue'
			'error')

	else if res.ok
		application.starred = false
		updateStar()
		notify.tell('Unstarred',
			'Application removed from your stars')


addEventListener('load', ->
	if not navigator.clipboard?
		shareButton.classList.add('hidden');

	params = new URLSearchParams(window.location.search)
	res = await fetch("/console/api/v0.1/applications/#{params.get('id')}/").catch(->
		notify.tell('Download error'
			'Could not download application data. Please check your internet connection.'
			'error')
	)

	if res.status is 404
		notify.tell('Not found'
			'Application not found. It may have been deleted or the link may be invalid.'
			'error')
	else
		application = await res.json()

		setupApplication()
)
