addEventListener('load', ->
	Storage = window.localStorage;
	body = document.querySelector('body')

	if Storage.getItem('mh_theme') is 'dark'
		body.classList.add('dark-theme')
)