applicationId = window.location.pathname.match(/\d*$/)
starText = document.querySelector('#star-text')
starIcon = document.querySelector('#star-icon')
statusIcon = document.querySelector('#status-icon')
starButton = document.querySelector('#star-button')
shareButton = document.querySelector('#share-button')
acceptButton = document.querySelector('#accept-button')
rejectButton = document.querySelector('#reject-button')

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


addEventListener('load', ->
	params = new URLSearchParams(window.location.search)

	res = await fetch('/console/get-application/' + params.get('id'))
	application = await res.json()
	updateStar(application.starred)
	if application.accepted
		acceptButton.classList.add('disabled')
		rejectButton.classList.add('disabled')
		acceptButton.title = rejectButton.title =
			(if application.accepted == 1 then 'This application is already accepted' else 'This application is already rejected')
	else
		acceptButton.addEventListener('click', accept)
		rejectButton.addEventListener('click', reject)

	switch application.accepted
		when 0 then statusIcon.src = '/img/progress.svg'
		when 1 then statusIcon.src = '/img/checkmark.svg'
		when -1 then statusIcon.src = '/img/cross.svg'
	statusIcon.alt = 'Status icon'

	document.title = application.firstName + '\'s application - My HR'

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
	linksElement.innerHTML = if application.links then application.links else '[Empty]'
	freeFormElement.innerHTML = if application.freeForm then application.freeForm else '[Empty]'
	fileLinkElement.innerHTML = application.fileName
	fileLinkElement.href = '/console/file/' + application.filePath
)


updateStar = (starred) ->
	if starred
		starIcon.src = '/img/star-active.svg'
		starText.innerHTML = 'Unstar'
		starButton.onclick = unstar

	else
		starIcon.src = '/img/star-inactive.svg'
		starText.innerHTML = 'Star'
		starButton.onclick = star


star = ->
	res = await fetch("/console/stars?applicationId=#{applicationId}", {
		method: 'post'
	})
	if res.ok
		updateStar(true)


unstar = ->
	res = await fetch("/console/stars?applicationId=#{applicationId}", {
		method: 'delete'
	})
	if res.ok
		updateStar(false)


shareButton.addEventListener('click', ->
	try
		await navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard!')
	catch
		alert('Unfortunately, we can\'t copy the link on your device.
			Please copy the link from the address bar manually.')
)


accept = ->
	if confirm("Are you sure you want to accept #{firstNameElement.innerHTML}\'s application?
			\n\nTHIS ACTION IS FINAL AND CANNOT BE UNDONE!
			\n\nIf you choose to continue, this application will be marked as accepted and
			#{firstNameElement.innerHTML} will receive a confirmation email immediately.
			\nIf you are still unsure about this application, it is recommended that you star it and
			return later for a final decision.")
		fetch('/console/applications/accept/?id=' + application.id, {
			method: 'post'
		})
		acceptButton.classList.add('disabled')
		rejectButton.classList.add('disabled')
		acceptButton.removeEventListener('click', accept)
		rejectButton.removeEventListener('click', reject)
		acceptButton.title = 'This application is already accepted'
		rejectButton.title = 'This application is already accepted'
		statusIcon.src = '/img/checkmark.svg'


reject = ->
	if confirm("Are you sure you want to reject #{firstNameElement.innerHTML}\'s application?
			\n\nTHIS ACTION IS FINAL AND CANNOT BE UNDONE!
			\n\nIf you choose to continue, this application will be marked as rejected and
			#{firstNameElement.innerHTML} will receive a confirmation email immediately.
			\nIf you are still unsure about this application, it is recommended that you leave this
			application for a final decision.")
		fetch('/console/applications/reject/?id=' + application.id, {
			method: 'post'
		})
		acceptButton.classList.add('disabled')
		rejectButton.classList.add('disabled')
		acceptButton.removeEventListener('click', accept)
		rejectButton.removeEventListener('click', reject)
		acceptButton.title = 'This application is already rejected'
		rejectButton.title = 'This application is already rejected'
		statusIcon.src = '/img/cross.svg'
