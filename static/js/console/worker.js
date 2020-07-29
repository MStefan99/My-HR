const resources = [
	// Views
	'/console/login/',
	'/console/register/',
	'/console/setup-otp/',
	'/console/',
	'/console/desktop/',
	'/console/applications/',
	'/console/application/',
	'/console/settings/',
	'/console/feedback/',
	'/console/notes/',
	'/console/versions/',
	'/console/about/',
	'/console/help/',
	'/console/users/',
	'/console/not-connected/',
	'/console/404/',
	// Stylesheets
	'/style/console.css',
	'/style/desktop.css',
	'/style/help.css',
	// Javascript
	'/js/console/application.js',
	'/js/console/applications.js',
	'/js/console/desktop.js',
	'/js/console/feedback.js',
	'/js/console/history.js',
	'/js/console/home.js',
	'/js/console/login.js',
	'/js/console/main.js',
	'/js/console/notes.js',
	'/js/console/notifications.js',
	'/js/console/pages.js',
	'/js/console/register.js',
	'/js/console/settings.js',
	'/js/console/setup_otp.js',
	'/js/console/users.js',
	// Images
	'/favicon.ico',
	'/img/application.svg',
	'/img/applications.svg',
	'/img/chat-bubble.svg',
	'/img/checkmark.svg',
	'/img/close.svg',
	'/img/cross.svg',
	'/img/desktop-dark.jpg',
	'/img/desktop.jpg',
	'/img/desktop.svg',
	'/img/exit.svg',
	'/img/forward.svg',
	'/img/help-application.jpg',
	'/img/help-applications.jpg',
	'/img/help-desktop.jpg',
	'/img/help-dock.jpg',
	'/img/help-feedback.jpg',
	'/img/help-note-editor.jpg',
	'/img/help-notes.jpg',
	'/img/help-proposals.jpg',
	'/img/help-settings.jpg',
	'/img/help-window.jpg',
	'/img/help.svg',
	'/img/home.svg',
	'/img/me-logo.svg',
	'/img/mh-logo.svg',
	'/img/progress.svg',
	'/img/refresh.svg',
	'/img/search.svg',
	'/img/settings.svg',
	'/img/share.svg',
	'/img/star-active.svg',
	'/img/star-inactive.svg',
	'/img/sticky-note.svg',
	'/img/verification_checkmark.svg'
];


const currentVersion = 'v0.11.1-beta';
const defaultOptions = {
	cache: false,
	revalidate: false,
	return503: false,
	ignoreQuery: false,
	preserveHeaders: true,
	preserveBody: true
}


async function saveToCache(req, res) {
	const cache = await caches.open(currentVersion);

	if (!([303, 400, 401, 403, 429, 500].includes(res.status))) {
		await cache.put(req, res);
	}
}


function canBeCached(req) {
	if (req.url.match(/api/)) {  // API requests
		if (req.method !== 'GET') {  // All non-GET requests
			return {
				cache: false
			};
		} else {  // All GET requests
			return {
				cache: true,
				revalidate: true
			};
		}
	} else {  // Client requests
		if (req.method !== 'GET') {  // All non-GET requests
			return {
				cache: false
			};
		} else if (req.url.match(/(otp|logout|exit)\/?$/)) {  // Logout requests
			return {
				cache: false,
				return503: true
			};
		} else if (req.url.match(/console(?!.*\.)/)) {  // HTML pages
			return {
				cache: true,
				revalidate: true,
				ignoreQuery: true,
				return503: true
			};
		} else {  // All other GET requests
			return {
				cache: true,
				return503: true
			};
		}
	}
}


async function handleRequest(req) {
	let url, headers, body, res;
	const cache = await caches.open(currentVersion);
	const options = Object.assign({}, defaultOptions, canBeCached(req));

	if (options.ignoreQuery) {
		url = req.url.replace(/\?.*$/, '');
	} else {
		url = req.url;
	}
	if (options.preserveHeaders) {
		headers = req.headers;
	}
	if (options.preserveBody) {
		body = req.body;
	}

	const workerRequest = new Request(url, {
		headers: headers,
		body: body,
		method: req.method,
		cache: req.cache,
		referrer: req.referrer
	});

	if (options.cache) {
		res = await cache.match(workerRequest);

		if (!res) {
			try {
				res = await fetch(url);
				await saveToCache(workerRequest, res.clone());
			} catch (e) {
				if (options.return503) {
					return cache.match('/console/not-connected/');
				}
			}
		} else if (options.revalidate) {
			try {
				res = await fetch(url);
				await saveToCache(workerRequest, res.clone());
			} catch (e) {
				console.warn('Failed to update resource');
			}
		}
	} else {
		try {
			res = await fetch(req);
		} catch (e) {
			if (options.return503) {
				return cache.match('/console/not-connected/');
			}
		}
	}

	if (res.ok && req.url.match(/api(?=.*applications\/($|\?))/)) {
		const applications = await res.clone().json();

		for (const application of applications) {
			const applicationURL = '/console/api/v0.1/applications/'
				+ application.id + '/';

			if (!await cache.match(applicationURL)) {
				try {
					fetch(applicationURL)
						.then(res => {
							saveToCache(applicationURL, res)
						});
				} catch (e) {
					console.warn('Failed to download application '
						+ application.id);
				}
			}
		}
	}
	return res;
}


addEventListener('install', async () => {
	caches.keys().then((keys) => {
		for (const key of keys) {
			if (key !== currentVersion) {
				caches.delete(key);
			}
		}
	});

	cache = await caches.open(currentVersion);
	for (const resource of resources) {
		fetch(resource, {
			headers: {
				'Cache-control': 'no-cache'
			}
		}).then(response => {
			saveToCache(resource, response);
		});
	}
});


self.addEventListener('fetch', (e) => {
	e.respondWith(handleRequest(e.request));
});


addEventListener('sync', async () => {
	const req = indexedDB.open('my-hr');

	req.onsuccess = (e => {
		const db = e.target.result;

		const store = db.transaction('unfinishedRequests', 'readwrite')
			.objectStore('unfinishedRequests');

		store.getAll()
			.onsuccess = async (event) => {
			const requests = event.target.result;

			for (const request of requests) {
				await fetch(request.path, request.init);
			}
		};

		store.clear();
	});
});
