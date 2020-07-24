'use strict';

const header = document.querySelector('header');
const main = document.querySelector('main');
const body = document.querySelector('body');
const desktop = document.querySelector('#desktop');
const dock = document.querySelector('#dock');
const dockShortcutContainer = document.querySelector('#dock-shortcut-container');
const dockIconContainer = document.querySelector('#dock-icon-container');
const dockSeparator = document.querySelector('#dock-separator')

const settingsIcon = document.querySelector('#settings-icon');
const settingsPanel = document.querySelector('#settings-panel');
const dockCheckbox = document.querySelector('#cb-dock');
const menuCheckbox = document.querySelector('#cb-menu');

const settingsLink = document.querySelector('#button-settings');
const helpLink = document.querySelector('#button-help');


let appLeft = 100;
let appTop = 50;
const appShift = 20;

const Storage = window.localStorage;
const apps = [];
const dockShortcuts = JSON.parse(Storage.getItem('desktop_dock-shortcuts')) || [];
const shortcutData = [
	{
		id: 0,
		src: '/console/applications',
		name: 'All applications',
		img: '/img/applications.svg',
	}, {
		id: 1,
		src: '/console/applications/?type=stars',
		name: 'Your stars',
		img: '/img/star-active.svg',
	}, {
		id: 2,
		src: '/console/applications/?type=pending',
		name: 'Pending applications',
		img: '/img/progress.svg',
	}, {
		id: 3,
		src: '/console/applications/?type=accepted',
		name: 'Accepted applications',
		img: '/img/checkmark.svg',
	}, {
		id: 4,
		src: '/console/applications/?type=rejected',
		name: 'Rejected applications',
		img: '/img/cross.svg',
	}, {
		id: 5,
		src: '/console/notes/',
		name: 'Notes',
		img: '/img/sticky-note.svg',
	}, {
		id: 6,
		src: '/console/feedback/',
		name: 'Feedback',
		img: '/img/chat-bubble.svg',
	}
];


function clamp(val, min, max) {
	if (val > max) {
		return max;
	} else if (val < min) {
		return min;
	} else {
		return val;
	}
}


function remove(element) {
	element.parentNode.removeChild(element);
}


function pushToFront(app) {
	for (const app of apps) {
		app.window.style['z-index'] = 0;
	}
	app.window.style['z-index'] = 1;
}


function saveApps() {
	Storage.setItem('desktop_open-apps', JSON.stringify(apps));
}


function loadApps() {
	const savedApps = JSON.parse(Storage.getItem('desktop_open-apps'));

	if (savedApps) {
		for (const app of savedApps) {
			new AppWindow(app.src,
				app.name,
				app.img)
		}
		return true;
	}
	return false;
}


class AppWindow {
	src;
	name;
	img;
	shortcut;
	left = clamp(appLeft + appShift,
		-250, screen.availWidth - 250);
	top = clamp(appTop + appShift,
		0, screen.availHeight - 250);
	window;
	iframeIconGroup;
	homeIcon;
	refreshIcon;
	header;
	title;
	windowIconGroup;
	minimizeIcon;
	maximizeIcon;
	closeIcon;
	content;
	iframe;
	dragHandler;

	constructor(src = '/console/',
	            name = 'Application',
	            img = '/img/mh-logo.svg') {
		this.src = src;
		this.name = name;
		this.img = img;

		appLeft += appShift;
		appTop += appShift;

		// Creating app window
		this.window = document.createElement('div');
		this.window.classList.add('app-window', 'hidden');
		this.window.style.left = this.left + 'px';
		this.window.style.top = this.top + 'px';
		this.window.addEventListener('mousedown', () => pushToFront(this));
		pushToFront(this);
		setTimeout(() => {
			this.window.classList.remove('hidden');
		}, 10);

		// Creating header with title
		this.header = document.createElement('div');
		this.header.classList.add('header');
		this.title = document.createElement('div');
		this.title.classList.add('title');
		this.title.innerHTML = name;

		// Creating left icons
		this.iframeIconGroup = document.createElement('div');
		this.iframeIconGroup.classList.add('icon-group');
		this.homeIcon = document.createElement('img');
		this.homeIcon.classList.add('icon-img', 'home-icon');
		this.homeIcon.src = '/img/home.svg';
		this.refreshIcon = document.createElement('img');
		this.refreshIcon.classList.add('icon-img', 'refresh-icon');
		this.refreshIcon.src = '/img/refresh.svg';
		this.homeIcon.addEventListener('click', () => this.home());
		this.refreshIcon.addEventListener('click', () => this.refresh());

		// Creating right icons
		this.windowIconGroup = document.createElement('div');
		this.windowIconGroup.classList.add('icon-group');
		this.minimizeIcon = document.createElement('div');
		this.minimizeIcon.classList.add('icon', 'minimize-icon');
		this.maximizeIcon = document.createElement('div');
		this.maximizeIcon.classList.add('icon', 'maximize-icon');
		this.closeIcon = document.createElement('div');
		this.closeIcon.classList.add('icon', 'close-icon');

		// Creating shortcut in dock
		this.shortcut = document.createElement('div');
		this.shortcut.classList.add('shortcut', 'hidden');
		this.shortcut.title = this.name;
		const icon = document.createElement('img');
		icon.src = this.img;
		icon.draggable = false;
		setTimeout(() => {
			this.shortcut.classList.remove('hidden')
		}, 10);

		// Creating iframe with app content
		this.content = document.createElement('div');
		this.content.classList.add('content');
		this.iframe = document.createElement('iframe');
		this.iframe.src = src;

		// Setting event handlers
		this.shortcut.addEventListener('click', () => {
			if (this.window.classList.contains('minimized')) {
				this.minimize();
				pushToFront(this);
			} else if (this.window.style['z-index'] === '0') {
				pushToFront(this);
			} else {
				this.minimize();
			}
		});
		this.shortcut.addEventListener('contextmenu', e => {
			this.close();
			e.preventDefault();
		});
		this.dragHandler = e => this.drag.bind(this)(e);
		this.header.addEventListener('mousedown', () => {
			this.header.addEventListener('mousemove', this.dragHandler);
		});
		this.header.addEventListener('mouseup', () => {
			this.header.removeEventListener('mousemove', this.dragHandler);
		});
		this.header.addEventListener('mousemove', e => e.stopPropagation());
		this.closeIcon.addEventListener('click', () => this.close());
		this.minimizeIcon.addEventListener('click', () => this.minimize());
		this.maximizeIcon.addEventListener('click', () => this.maximize());
		this.iframe.addEventListener('load', () => {
			modifyAppStyle(this.iframe);
		});

		// Adding created app and shortcut to DOM
		main.appendChild(this.window);
		this.window.appendChild(this.header);
		this.header.appendChild(this.iframeIconGroup);
		this.iframeIconGroup.appendChild(this.homeIcon);
		this.iframeIconGroup.appendChild(this.refreshIcon);
		this.header.appendChild(this.title);
		this.header.appendChild(this.windowIconGroup);
		this.windowIconGroup.appendChild(this.maximizeIcon);
		this.windowIconGroup.appendChild(this.minimizeIcon);
		this.windowIconGroup.appendChild(this.closeIcon);
		this.window.appendChild(this.content);
		this.content.appendChild(this.iframe);
		dockIconContainer.appendChild(this.shortcut);
		this.shortcut.appendChild(icon);

		// Adding created app to app list
		apps.push(this);

		// Saving apps to restore them on refresh
		saveApps();
	}


	drag(e) {
		this.left += e.movementX;
		this.top += e.movementY;

		this.top = clamp(this.top,
			0,
			screen.availHeight - 50);
		this.left = clamp(this.left,
			-(this.window.offsetWidth - 75),
			screen.availWidth - 75);

		this.window.style.left = this.left + 'px';
		this.window.style.top = this.top + 'px';

		appLeft = this.left;
		appTop = this.top;
	}

	minimize() {
		if (this.window.classList.contains('maximized')) {
			this.maximize();
		}
		if (!this.window.classList.contains('minimized')) {
			this.window.style['z-index'] = 0;
		}
		this.window.classList.toggle('minimized');
	}


	maximize() {
		if (this.window.classList.contains('maximized')) {
			header.classList.remove('hidden');
			dock.classList.remove('hidden');

			for (const app of apps) {
				app.window.classList.remove('hidden');
			}
			setTimeout(() => {
				this.window.classList.remove('animated');
			}, 250);
		} else {
			header.classList.add('hidden');
			dock.classList.add('hidden');

			for (const app of apps) {
				if (this !== app) {
					app.window.classList.add('hidden');
				}
			}
			this.window.classList.add('animated');
		}
		this.window.classList.toggle('maximized');
	}


	close() {
		if (this.window.classList.contains('maximized')) {
			this.maximize();
		}
		this.window.classList.add('hidden');
		this.shortcut.classList.add('hidden');

		setTimeout(() => {
			apps.splice(apps.indexOf(this), 1);
			saveApps();

			remove(this.window);
			remove(this.shortcut);
		}, 400);
	}


	home() {
		this.iframe.src = this.src;
	}


	refresh() {
		this.iframe.contentWindow.location.reload();
	}


	toJSON() {
		return {
			src: this.src,
			name: this.name,
			img: this.img
		}
	}
}


// This function is used to to modify the iframe content
function modifyAppStyle(iframe) {
	const document = iframe.contentDocument;
	const window = iframe.contentWindow;

	const body = document.querySelector('body');
	const header = document.querySelector('header');
	const main = document.querySelector('main');
	const footer = document.querySelector('footer');

	// Styling the page to look like an app
	remove(header);
	remove(footer);
	body.style.background = 'none';
	if (main) {
		main.style.background = 'none';
		main.style['border-radius'] = '0';
		main.style.margin = '0';
	}

	// Replacing 'Open in desktop' with 'Open in a new window' button on application page
	if (window.location.href.match(/application(?!s)/)) {
		const desktopButton = document.querySelector('#desktop-button');
		remove(desktopButton);

		const newButton = document.createElement('span');
		newButton.classList.add('button');
		document.querySelector('.button-container').appendChild(newButton);

		const buttonText = document.createElement('span');
		buttonText.classList.add('text');
		newButton.appendChild(buttonText);

		const buttonImage = document.createElement('img');
		buttonImage.classList.add('icon');
		buttonImage.src = '/img/desktop.svg';
		buttonImage.alt = buttonText.innerHTML = newButton.title = 'Open in a new window';
		newButton.appendChild(buttonImage)

		newButton.addEventListener('click', () => {
			new AppWindow(window.location.href,
				document.title.replace(' - My HR', ''),
				'/img/application.svg'
			)
		});
	}
}


// Setting event listeners for shortcuts
shortcutData.forEach((data) => {
	const dockShortcuts = Storage.getItem('desktop_dock-shortcuts') || [];

	const shortcut = document.createElement('div');
	shortcut.classList.add('shortcut');
	shortcut.draggable = true;
	shortcut.title = data.name;
	shortcut.id = 'shortcut-' + data.id;

	const image = document.createElement('img');
	image.src = data.img;
	image.draggable = false;
	shortcut.appendChild(image);

	if (dockShortcuts.includes(data.id)) {
		dockShortcutContainer.appendChild(shortcut);
		dockSeparator.classList.remove('hidden');
	} else {
		desktop.appendChild(shortcut);
	}

	shortcut.addEventListener('click', () => {
		new AppWindow(data.src, data.name, data.img);
	});

	shortcut.addEventListener('dragstart', (e) => {
		e.dataTransfer.setData('text/id', data.id);
	});
});


[dock, main].forEach((element) => {
	element.addEventListener('dragover', (e) => {
		if (e.dataTransfer.types.includes('text/id')) {
			e.preventDefault();
		}
	})
});


dock.addEventListener('drop', (e) => {
	e.stopPropagation();
	const id = e.dataTransfer.getData('text/id');
	const shortcut = document.querySelector('#shortcut-' + id);

	dockShortcuts.push(id);
	dockShortcutContainer.appendChild(shortcut);

	Storage.setItem('desktop_dock-shortcuts', JSON.stringify(dockShortcuts));
});


main.addEventListener('drop', (e) => {
	const id = e.dataTransfer.getData('text/id');
	const shortcut = document.querySelector('#shortcut-' + id);

	dockShortcuts.splice(dockShortcuts.indexOf(id), 1);
	desktop.appendChild(shortcut);

	Storage.setItem('desktop_dock-shortcuts', JSON.stringify(dockShortcuts));
});


// Listener stopping window drag when mouse moves away
addEventListener('mousemove', () => {
	for (const app of apps) {
		app.header.removeEventListener('mousemove', app.dragHandler);
	}
});


// Listener closing settings panel on click outside
main.addEventListener('click', () => {
	settingsPanel.classList.add('hidden');
});


settingsIcon.addEventListener('click', () => {
	settingsPanel.classList.toggle('hidden');
});


menuCheckbox.addEventListener('click', () => {
	if (menuCheckbox.checked) {
		header.classList.add('auto-hide');
	} else {
		header.classList.remove('auto-hide');
	}
	Storage.setItem('desktop_hide-menu', menuCheckbox.checked);
});


dockCheckbox.addEventListener('click', () => {
	if (dockCheckbox.checked) {
		dock.classList.add('auto-hide');
	} else {
		dock.classList.remove('auto-hide');
	}
	Storage.setItem('desktop_hide-dock', dockCheckbox.checked);
});


settingsLink.addEventListener('click', () => {
	new AppWindow('/console/settings/',
		'Settings',
		'/img/settings.svg');
});


helpLink.addEventListener('click', () => {
	new AppWindow('/console/help/',
		'Help',
		'/img/help.svg');
});


addEventListener('popstate', () => {
	if (confirm('You are about to exit Desktop. Do you wish to continue?')) {
		window.history.back();
	} else {
		window.history.pushState({}, 'Back warning');
	}
});


// Initial setup when Desktop is opened
addEventListener('load', () => {
	if (screen.width < 1024) {
		alert('Desktop is not supported on devices with small screen sizes. ' +
			'You will have to return back.');
		window.history.back();
		return;
	}

	if (Storage.getItem('mh_theme') === 'dark') {
		body.classList.add('dark-theme');
	}

	if (!loadApps()) {
		new AppWindow('/console/applications/',
			'All applications',
			'/img/applications.svg'
		);
	}
	if (Storage.getItem('desktop_help-viewed') !== 'true') {
		Storage.setItem('desktop_help-viewed', 'true');
		new AppWindow('/console/help/#text-desktop',
			'Welcome to Desktop!'
		);
	}
	if (Storage.getItem('desktop_autorun')) {
		const app = JSON.parse(Storage.getItem('desktop_autorun'));
		new AppWindow(app.src,
			app.name,
			app.img);

		Storage.removeItem('desktop_autorun');
	}

	menuCheckbox.checked = Storage.getItem('desktop_hide-menu') === 'true';
	dockCheckbox.checked = Storage.getItem('desktop_hide-dock') === 'true';

	if (Storage.getItem('desktop_hide-menu') === 'true') {
		header.classList.add('auto-hide');
	}
	if (Storage.getItem('desktop_hide-dock') === 'true') {
		dock.classList.add('auto-hide');
	}

	window.history.pushState({}, 'Back warning');
});
