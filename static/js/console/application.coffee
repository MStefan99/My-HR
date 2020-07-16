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
fileLinkElement = document.querySelector('#file-link')

application = {}
Storage = window.localStorage


import {saveRequest} from '/js/console/main.js'


remove = (element) ->
	element.parentNode.removeChild(element)


propose = (status) ->
	if confirm("Are you sure you want to #{if status is 1 then 'accept' else 'reject'}
			#{firstNameElement.innerHTML}\'s application?")
		init =
			method: 'post'
			headers:
				'Content-Type': 'application/json'
			body: JSON.stringify(
				applicationID: application.id
				status: status
			)
		res = await fetch('/console/api/v0.1/approvals/', init).catch(->
			saveRequest('/console/api/v0.1/approvals/', init)
		)

		switch await res.text()
			when 'NO_APPLICATION'
				alert('The application was not found. It may have been deleted or the URL is wrong.')
			when 'INVALID_STATUS'
				alert('Your proposal could not be processed due to the internal error.
					Please contact the support.')
			when 'ALREADY_ACCEPTED'
				alert('This application was already accepted, you cannot change its status anymore.')
			when 'ALREADY_REJECTED'
				alert('This application was already rejected, you cannot change its status anymore.')
			when 'ALREADY_EXISTS'
				alert('You have already made a proposal for this application. Please take it back first.')
			when 'ACCEPTED'
				application.accepted = 1
			when 'REJECTED'
				application.accepted = -1
			when 'Created'
				switch status
					when 1 then application.proposals.accepted = application.proposals.accepted + 1 || 1
					when -1 then application.proposals.rejected = application.proposals.rejected + 1 || 1
				application.proposals.my = status

		updateStatus()
		setBadges()


deleteProposal = ->
	if confirm('Are you sure you want to take your proposal back?')
		init =
			method: 'delete'
			headers:
				'Content-Type': 'application/json'
			body: JSON.stringify(
				applicationID: application.id
			)
		res = await fetch('/console/api/v0.1/approvals/', init).catch(->
			saveRequest('/console/api/v0.1/approvals/', init)
		)

		switch await res.text()
			when 'ALREADY_ACCEPTED'
				alert('This application was already accepted, you cannot change its status anymore.')
			when 'ALREADY_REJECTED'
				alert('This application was already rejected, you cannot change its status anymore.')
			when 'OK'
				switch application.proposals.my
					when 1 then application.proposals.accepted -= 1
					when -1 then application.proposals.rejected -= 1
				application.proposals.my = null

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
			src: window.location.pathname + window.location.search,
			name: application.firstName + '\'s application'
			img: '/img/application.svg'
		))
		window.location.href = '/console/desktop/'
	)

	shareButton.addEventListener('click', ->
		if 'writeText' in navigator.clipboard
			await navigator.clipboard.writeText(window.location.href)
			alert('Link copied to clipboard!')
		else
			alert('Unfortunately, we can\'t copy the link on your device.
			Please copy the link from the address bar manually.')
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
	links = application.links.replace(/(http:\/\/|https:\/\/)?(\S*?\.\S*)/g,
		'<a href="https://$2" target="_blank">$&</a>')
	linksElement.innerHTML = links or '[Empty]'
	freeFormElement.innerHTML = application.freeForm or '[Empty]'
	fileLinkElement.innerHTML = application.fileName
	fileLinkElement.href = '/console/file/' + application.filePath



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
			when -1
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
		body: JSON.stringify(
			applicationID: application.id
		)
	res = await fetch('/console/api/v0.1/stars/', init).catch(->
		saveRequest('/console/api/v0.1/stars', init)
	)
	if res.ok
		application.starred = true
		updateStar()


unstar = ->
	init =
		method: 'delete'
		headers:
			'Content-Type': 'application/json'
		body: JSON.stringify(
			applicationID: application.id
		)
	res = await fetch('/console/api/v0.1/stars/', init).catch(->
		saveRequest('/console/api/v0.1/stars/', init)
	)
	if res.ok
		application.starred = false
		updateStar()


addEventListener('load', ->
	if not navigator.clipboard?
		shareButton.classList.add('hidden');

	params = new URLSearchParams(window.location.search)
	res = await fetch('/console/api/v0.1/application/?applicationID=' + params.get('id')).catch(->
		alert('Could not download application data. Please check your internet connection.')
	)

	if res.status is 403
		alert('You have been signed out. Please sign in again to continue using My HR.')
	else if res.status is 404
		alert('Application not found. It may have been deleted or the link may be invalid.')
	else
		application = await res.json()

		setupApplication()
)
