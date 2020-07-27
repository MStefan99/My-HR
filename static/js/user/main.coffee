header = document.querySelector('header')


addEventListener('scroll', ->
	if window.scrollY
		header.style.background = 'var(--panel-color)'
	else
		header.style.background = 'none'
)
