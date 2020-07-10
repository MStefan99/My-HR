Storage = window.localStorage;
body = document.querySelector('body')


if Storage.getItem('mh_theme') is 'dark'
	body.classList.add('dark-theme')


navigator.serviceWorker.register('/js/console/worker.js',
	scope: '/console/'
)