'use strict';

body = document.querySelector('body')
sessionTable = document.querySelector('#sessions-table')
lightRadio = document.querySelector('#theme-light')
darkRadio = document.querySelector('#theme-dark')

Storage = window.localStorage;


import {saveRequest} from '/js/console/main.js'
import * as notify from '/js/console/notifications.js'


remove = (element) ->
	element.parentNode.removeChild(element)


addSession = (session) ->
	sessionRow = document.createElement('tr')
	sessionTable.appendChild(sessionRow)

	ipCell = document.createElement('td')
	ipCell.innerHTML = session.ip.replace('::ffff:', '')
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

	logoutCell = document.createElement('td')
	sessionRow.appendChild(logoutCell);
	logoutLink = document.createElement('span')
	logoutLink.classList.add('clickable')
	logoutLink.innerHTML = 'Sign out'
	logoutCell.appendChild(logoutLink)
	logoutLink.addEventListener('click', ->
		if await notify.ask('Sign out'
			'Are you sure you want to sign out on this device?'
			'warning')
			init =
				method: 'delete'
				headers:
					'Content-Type': 'application/json'
				body: JSON.stringify(
					sessionID: session.uuid
				)
			res = await fetch('/console/api/v0.1/sessions/', init).catch(->
				saveRequest('/console/api/v0.1/sessions', init)
			)

			if res.ok
				remove(sessionRow)
				notify.tell('Signed out'
					'Device was signed out successfully')
	)


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


	res = await fetch('/console/api/v0.1/sessions/').catch(->
		notify.tell('Download error'
			'Could not download session list.
			Please check your internet connection.'
			'error')
	)

	if res.ok
		sessions = await res.json()

		for session in sessions
			addSession(session)
)
