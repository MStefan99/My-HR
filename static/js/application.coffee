applicationId = window.location.pathname.match(/\d*$/)
starText = document.querySelector('#star-text')
starIcon = document.querySelector('#star-icon')
firstNameElement = document.querySelector('#first-name')
starButton = document.querySelector('#star-button')
shareButton = document.querySelector('#share-button')
acceptButton = document.querySelector('#accept-button')
rejectButton = document.querySelector('#reject-button')


addEventListener('load', ->
	res = await fetch('/console/get-stars/' + applicationId)
	starred = await res.json()

	update(starred)
)


update = (starred) ->
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
		update(true)


unstar = ->
	res = await fetch("/console/stars?applicationId=#{applicationId}", {
		method: 'delete'
	})
	if res.ok
		update(false)


shareButton.addEventListener('click', ->
	try
		await navigator.clipboard.writeText(window.location.href)
		alert('Link copied to clipboard!')
	catch
		alert('Unfortunately, we can\'t copy the link on your device.
			Please copy the link from the address bar manually.')
)


acceptButton.addEventListener('click', ->
	if confirm("Are you sure you want to accept #{firstNameElement.innerHTML}\'s application?
		\n\nTHIS ACTION IS FINAL AND CANNOT BE UNDONE!
		\n\nIf you choose to continue, this application will be marked as accepted and
		#{firstNameElement.innerHTML} will receive a confirmation email immediately.
		\nIf you are still unsure about this application, it is recommended that you star it and
		return later for a final decision.")
		console.log('accepted')
)


rejectButton.addEventListener('click', ->
	if confirm("Are you sure you want to reject #{firstNameElement.innerHTML}\'s application?
		\n\nTHIS ACTION IS FINAL AND CANNOT BE UNDONE!
		\n\nIf you choose to continue, this application will be marked as rejected and
		#{firstNameElement.innerHTML} will receive a confirmation email immediately.
		\nIf you are still unsure about this application, it is recommended that you leave this
		application for a final decision.")
		console.log('rejected')
)
