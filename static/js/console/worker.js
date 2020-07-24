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


const currentVersion = 'v0.10.3-beta'


async function saveToCache(req, res) {
	const cache = await caches.open(currentVersion);

	if (!(res.status in [303, 400, 401, 403, 500])) {
		await cache.put(req, res);
	}
}


function canBeCached(req) {
	if (req.url.match(/api/)) {  // API requests
		if (req.method !== 'GET') {  // All non-GET requests
			return 'NO';
		} else if (req.url.match(/otp/)) {  // OTP request
			return 'NO';
		} else {  // All GET requests
			return 'MUST_UPDATE';
		}
	} else {  // Client requests
		if (req.method !== 'GET') {  // All non-GET requests
			return 'NO';
		} else if (req.url.match(/(logout|exit)\/?$/)) {  // Logout requests
			return 'NO_WITH_503';
		} else if (req.url.match(/console(?!.*\.)/)) {  // HTML pages
			return 'MUST_UPDATE';
		} else {  // All other GET requests
			return 'YES';
		}
	}
}


async function handleRequest(req) {
	const cache = await caches.open(currentVersion);

	switch (canBeCached(req)) {
		case 'YES':
			// NOTE: Query parameters are ignored!
			const url = req.url.replace(/\?.*$/, '');

			const cachedRes = await cache.match(url);
			if (cachedRes) {
				return cachedRes;
			} else {
				try {
					const res = await fetch(url);

					await saveToCache(req, res.clone());
					return res;
				} catch (e) {
					return cache.match('/console/not-connected/');
				}
			}

		case 'MUST_UPDATE':
			try {
				const res = await fetch(req);

				await saveToCache(req, res.clone());
				return res;
			} catch (e) {
				const res = await cache.match(req);

				if (res) {
					return res;
				} else {
					return cache.match('/console/not-connected/');
				}
			}

		case 'NO_WITH_503':
			try {
				return await fetch(req);
			} catch (e) {
				return cache.match('/console/not-connected/');
			}

		case 'NO':
			return await fetch(req);
	}
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
