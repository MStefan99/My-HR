'use strict';

body = document.querySelector('body')
sessionTable = document.querySelector('#sessions-table')
lightRadio = document.querySelector('#theme-light')
darkRadio = document.querySelector('#theme-dark')

Storage = window.localStorage;


lightRadio.addEventListener('click', ->
	body.classList.remove('dark-theme')
	Storage.setItem('mh_theme', 'light')
)


darkRadio.addEventListener('click', ->
	body.classList.add('dark-theme')
	Storage.setItem('mh_theme', 'dark')
)


addEventListener('load', ->
	if Storage.getItem('mh_theme') is 'dark'
		darkRadio.checked = true
	else
		lightRadio.checked = true


	res = await fetch('/console/get-sessions/').catch(->
		alert('Could not download session list.
			Please check your internet connection.')
	)
	sessions = await res.json()

	for session in sessions
		sessionRow = document.createElement('tr')
		sessionTable.appendChild(sessionRow)

		ipCell = document.createElement('td')
		ipCell.innerHTML = session.ip
		sessionRow.appendChild(ipCell)

		osCell = document.createElement('td')
		res = session.ua.match(/.*? \((.*?); (.*?)(;|\)).*/)
		if res[1] is 'Linux'
			os = res[2]
		else if res[2] is 'Win64'
			os = res[1].replace('NT ', '').replace('.0', '')
		else if res[1] is 'Macintosh'
			os = 'macOS ' + res[2].replace(/.*Mac OS X (.*?)$/, '$1').replace(/_/g, '.')
		else if res[1] is 'iPhone'
			os = 'iPhone (iOS ' + res[2].replace(/.*OS (.*?) like.*/, '$1)').replace(/_/g, '.')
		else if res[1] is 'iPad'
			os = 'iPad (iPadOS ' + res[2].replace(/.*OS (.*?) like.*/, '$1)').replace(/_/g, '.')
		else
			os = res[1]
		osCell.innerHTML = os
		sessionRow.appendChild(osCell)

		browserCell = document.createElement('td')
		browserCell.innerHTML = session.ua.replace(/.*(Chrome|Firefox|EdgA?|OPR)\/(.*?)\..*/, '$1 $2')
			.replace(/.*(Safari)\/(.*?)\..*/, '$1 $2')
			.replace(/EdgA?/, 'Edge')
			.replace(/OPR/, 'Opera')
		sessionRow.appendChild(browserCell)

		timeCell = document.createElement('td')
		timeCell.innerHTML = new Date(session.time).toLocaleString('en-GB')
		sessionRow.appendChild(timeCell)
)
