const offlineResources = [
	// Views
	'/console/login/',
	'/console/register/',
	'/console/setup-otp/',
	'/console/',
	'/console/desktop/',
	'/console/applications/',
	'/console/applications/?type=stars',
	'/console/applications/?type=pending',
	'/console/applications/?type=accepted',
	'/console/applications/?type=rejected',
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
	'/img/applications.svg',
	'/img/checkmark.svg',
	'/img/cross.svg',
	'/img/desktop.jpg',
	'/img/help-application.jpg',
	'/img/help-desktop.jpg',
	'/img/help-feedback.jpg',
	'/img/help-notes.jpg',
	'/img/help-window.jpg',
	'/img/home.svg',
	'/img/mh-logo.svg',
	'/img/refresh.svg',
	'/img/share.svg',
	'/img/star-inactive.svg',
	'/img/chat-bubble.svg',
	'/img/close.svg',
	'/img/desktop-dark.jpg',
	'/img/exit.svg',
	'/img/help-applications.jpg',
	'/img/help-dock.jpg',
	'/img/help-note-editor.jpg',
	'/img/help-settings.jpg',
	'/img/help.svg',
	'/img/me-logo.svg',
	'/img/progress.svg',
	'/img/settings.svg',
	'/img/star-active.svg',
	'/img/sticky-note.svg'
];


const currentVersion = 'v0.9.1-beta'


addEventListener('install', async () => {
	caches.keys().then((keys) => {
		for (const key of keys) {
			if (key !== currentVersion) {
				caches.delete(key);
			}
		}
	});

	cache = await caches.open(currentVersion);
	for (const resource of offlineResources) {
		fetch(resource).then(response => {
			if (!response.status in [400, 404]) {
				cache.put(resource, response);
			}
		});
	}
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


function canBeCached(req) {
	if (req.url.match(/api/)) {
		if (req.method !== 'GET') {
			return 'NO';
		} else if (req.url.match(/otp/)) {
			return 'NO';
		} else {
			return 'MUST_UPDATE';
		}
	} else {
		if (req.method !== 'GET') {
			return 'NO';
		} else if (req.url.match(/logout|exit/)) {
			return 'NO';
		} else {
			return 'YES';
		}
	}
}


async function handleRequest(req) {
	const cache = await caches.open(currentVersion);
	const cachedRes = await cache.match(req);

	switch (canBeCached(req)) {
		case 'YES':
			if (cachedRes) {
				return cachedRes;
			} else {
				try {
					const res = await fetch(req);

					if (res.ok) {
						await cache.put(req, res.clone());
					}
					return res;
				} catch (e) {
					return cache.match('/console/not-connected/');
				}
			}

		case 'MUST_UPDATE':
			try {
				const res = await fetch(req);

				if (res.ok) {
					await cache.put(req, res.clone());
				}
				return res;
			} catch (e) {
				return cache.match(req);
			}

		case 'NO':
			return fetch(req);
	}
}


self.addEventListener('fetch', (e) => {
	e.respondWith(handleRequest(e.request));
});
