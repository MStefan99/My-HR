'use strict';

logo = document.querySelector('#logo')
textLeft = document.querySelector('#text-left')
textRight = document.querySelector('#text-right')
splashText = document.querySelector('#splash-text')
welcomeContainer = document.querySelector('#welcome-container')
contentContainer = document.querySelector('#content-container')

applicationPeriodEnd = 1603054800000


addEventListener('load', ->
	[logo, textLeft, textRight].forEach((e) ->
		e.classList.remove('invisible'))

	if Date.now() > applicationPeriodEnd
		welcomeContainer.classList.add('hidden')
		splashText.innerHTML = 'Unfortunately, application period is over.
			Thank you for your interest in Mine Eclipse!'

		splashText.classList.remove('hidden')
	else
		contentContainer.classList.remove('hidden')

		setTimeout(->
			welcomeContainer.classList.remove('invisible')
		, 1600)
		splashText.classList.remove('hidden')
		setInterval(->
			timeLeft = applicationPeriodEnd - Date.now()

			seconds = (timeLeft // 1000) % 60;
			minutes = (timeLeft // 1000 // 60) % 60;
			hours = (timeLeft // 1000 // 60 // 60) % 24;
			days = (timeLeft // 1000 // 60 // 60 // 24);
			splashText.innerHTML = "Application period ends in
				#{days} days, #{hours} hours, #{minutes} minutes and #{seconds} seconds"
		, 1000)
)
