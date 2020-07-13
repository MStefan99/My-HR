insertAfter = (referenceNode, newNode) ->
	referenceNode.parentNode
	.insertBefore(newNode, referenceNode.nextSibling)


filterPage = (pageNumber, nodes, elementCount) ->
	nodes.forEach((node) ->
		node.classList.add('page-hidden')
	)

	startIndex = if pageNumber then (nodes.length % elementCount) + (pageNumber - 1) * elementCount else 0
	endIndex = (if pageNumber then pageNumber * elementCount else 0) + nodes.length % elementCount - 1

	for i in [startIndex..endIndex]
		nodes[i].classList.remove('page-hidden')


setupPagination = (table, elementCount) ->
	# Counting rows
	body = table.querySelector('tbody')
	rows = body.childNodes
	pageCount = Math.ceil(rows.length / elementCount)

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
					filterPage(i, rows, elementCount)
					pageButtons = document.querySelectorAll('.page-selector')
					pageButtons.forEach((button) ->
						button.classList.remove('pressed')
					)
					pageButton.classList.add('pressed')
				)

				pageButton.innerHTML = i + 1
				paginator.appendChild(pageButton)

	filterPage(0, rows, elementCount)


export paginate = (elementCount = 10) ->
	tables = document.querySelectorAll('.paginated')

	for table in tables
		setupPagination(table, elementCount)
