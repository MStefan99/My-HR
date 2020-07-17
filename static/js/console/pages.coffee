'use strict';


remove = (element) ->
	element.parentNode.removeChild(element)


insertAfter = (referenceNode, newNode) ->
	referenceNode.parentNode
	.insertBefore(newNode, referenceNode.nextSibling)


openPage = (pageNumber, nodes, pageSize) ->
	nodes.forEach((node) ->
		node.classList.add('page-hidden')
	)

	firstPageCount = nodes.length % pageSize || pageSize
	if not pageNumber
		startIndex = 0
		endIndex = firstPageCount
	else
		startIndex = (pageNumber - 1) * pageSize + firstPageCount
		endIndex = pageNumber * pageSize + firstPageCount

	for i in [startIndex..endIndex - 1]
		nodes[i].classList.remove('page-hidden')


setupPagination = (table, options = {}) ->
	pageSize = options.pageSize || 10

	# Counting rows
	body = table.querySelector('tbody')
	rows = [...body.childNodes]
	if 'filter' of options
		rows = rows.filter((row) -> options.filter(row))
	pageCount = Math.ceil(rows.length / pageSize)

	# Creating and adding paginator div
	paginator = document.createElement('div')
	paginator.classList.add('paginator')
	insertAfter(table, paginator)

	# Creating and adding page buttons to paginator
	if pageCount > 1
		for i in [0 .. pageCount - 1]
			do (i) ->
				pageButton = document.createElement('div')
				pageButton.classList.add('button', 'page-selector')

				if i is 0
					pageButton.classList.add('pressed')

				pageButton.addEventListener('click', ->
					openPage(i, rows, pageSize)
					pageButtons = document.querySelectorAll('.page-selector')
					pageButtons.forEach((button) ->
						button.classList.remove('pressed')
					)
					pageButton.classList.add('pressed')
				)

				pageButton.innerHTML = i + 1
				paginator.appendChild(pageButton)

	openPage(0, rows, pageSize)


export paginate = (options) ->
	# Removing old pagination in case table is re-paginated
	document.querySelectorAll('.paginator').forEach((paginator) ->
		remove(paginator)
	)
	document.querySelectorAll('.page-hidden').forEach((element) ->
		element.classList.remove('page-hidden')
	)

	# Setting up new pagination
	tables = document.querySelectorAll('.paginated')
	for table in tables
		setupPagination(table, options)
