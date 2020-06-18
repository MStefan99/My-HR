starButton = document.querySelector('#star-button')
starText = document.querySelector('#star-text')
starIcon = document.querySelector('#star-icon')
shareButton = document.querySelector('#share-button')
applicationId = window.location.pathname.match(/\d*$/)


addEventListener('load', ->
	res = await fetch('/console/get-stars/' + applicationId)
	starred = await res.json()

	update(starred)
)


shareButton.addEventListener('click', ->
	await navigator.clipboard.writeText(window.location.href)
	alert('Link copied to clipboard!')
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