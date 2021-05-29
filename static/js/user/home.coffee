'use strict';

logo = document.querySelector('#logo')
textLeft = document.querySelector('#text-left')
textRight = document.querySelector('#text-right')
splashText = document.querySelector('#splash-text')
welcomeContainer = document.querySelector('#welcome-container')
contentContainer = document.querySelector('#content-container')
usernameInput = document.querySelector('#username')
submitButton = document.querySelector('#submit')

applicationPeriodEnd = 1602450000000


remove = (element) ->
	element.parentNode.removeChild(element)


validate = ->
	submitButton.disabled = false

	if not usernameInput.value.match(/^[\w\.]+$/)
		usernameInput.classList.add('status-bad')
		submitButton.disabled = true
	else
		usernameInput.classList.remove('status-bad')


addEventListener('load', ->
	[logo, textLeft, textRight].forEach((e) ->
		e.classList.remove('inactive')
	)
	validate()

	if Date.now() > applicationPeriodEnd
		contentContainer.classList.add('hidden')
		document.querySelector('#welcome-container h1')
			.innerText = 'Application period is over'
		document.querySelector('#welcome-container h2')
			.innerText = 'Unfortunately, application period is over.
			Thank you for your interest in Mine Eclipse!'
		remove(document.querySelector('#welcome-container a'))
	else
		setInterval(->
			timeLeft = applicationPeriodEnd - Date.now()

			seconds = (timeLeft // 1000) % 60;
			minutes = (timeLeft // 1000 // 60) % 60;
			hours = (timeLeft // 1000 // 60 // 60) % 24;
			days = (timeLeft // 1000 // 60 // 60 // 24);
			splashText.innerHTML = "Application period ends in
			#{days} days, #{hours} hours, #{minutes} minutes and #{seconds} seconds"
		, 1000)

	setTimeout(->
		welcomeContainer.classList.remove('inactive')
	, 1600)
)


usernameInput.addEventListener('input', validate)
