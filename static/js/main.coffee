'use strict';

logo = document.querySelector('#logo')
textLeft = document.querySelector('#text-left')
textRight = document.querySelector('#text-right')
welcomeContainer = document.querySelector('#welcome-container')


addEventListener('load', ->
	[logo, textLeft, textRight, welcomeContainer].forEach((e) ->
		e.classList.remove('hidden'))
)
