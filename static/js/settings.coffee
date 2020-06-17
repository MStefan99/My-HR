sessionTable = document.querySelector('#sessions-table')


addEventListener('load', ->
	res = await fetch('/console/sessions/')
	sessions = await res.json();

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
		else
			os = res[1]
		osCell.innerHTML = os
		sessionRow.appendChild(osCell)

		browserCell = document.createElement('td')
		browserCell.innerHTML = session.ua.replace(/.*(Chrome|Firefox|Edg|OPR)\/(.*?)\..*/, '$1 $2')
			.replace(/.*(Safari)\/(.*?)\..*/, '$1 $2')
			.replace('Edg', 'Edge')
			.replace('OPR', 'Opera')
		sessionRow.appendChild(browserCell)

		timeCell = document.createElement('td')
		timeCell.innerHTML = new Date(session.time).toLocaleString('en-GB')
		sessionRow.appendChild(timeCell)
)