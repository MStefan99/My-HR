const header = document.querySelector('header');
const main = document.querySelector('main');
const dock = document.querySelector('#dock');
const shortcuts = document.querySelectorAll('footer .dock-shortcut');

const settingsIcon = document.querySelector('#settings-icon');
const settingsPanel = document.querySelector('#settings-panel');
const dockCheckbox = document.querySelector('#cb-dock');
const menuCheckbox = document.querySelector('#cb-menu');

const settingsLink = document.querySelector('#button-settings');
const helpLink = document.querySelector('#button-help');


let appLeft = 50;
let appTop = 50;
const appShift = 20;

const Storage = window.localStorage;
const apps = [];


function clamp(val, min, max) {
	if (val > max) {
		return max;
	} else if (val < min) {
		return min;
	} else {
		return val;
	}
}


function pushToFront(app) {
	for (const app of apps) {
		app.window.style['z-index'] = 0;
	}
	app.window.style['z-index'] = 1;
}


remove = function (element) {
	return element.parentNode.removeChild(element);
};


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
		this.shortcut.classList.add('dock-shortcut', 'hidden');
		const icon = document.createElement('img');
		icon.src = this.img;
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
		this.shortcut.addEventListener('contextmenu', (e) => {
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
			modifyAppStyle(this.iframe.contentDocument);
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
		dock.appendChild(this.shortcut);
		this.shortcut.appendChild(icon);

		// Adding created app to app list
		apps.push(this);
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
}


modifyAppStyle = function (iframeDocument) {
	const iframeBody = iframeDocument.querySelector('body');
	const iframeHeader = iframeDocument.querySelector('header');
	const iframeMain = iframeDocument.querySelector('main');
	const iframeFooter = iframeDocument.querySelector('footer');

	remove(iframeHeader);
	remove(iframeFooter);

	iframeBody.style.background = '#ffffff33';
	iframeMain.style.background = 'none';
	iframeMain.style['border-radius'] = '0';
	iframeMain.style.margin = '0';
};


// Setting event listeners for shortcuts
shortcuts.forEach((shortcut) => {
	shortcut.addEventListener('click', () => {
		const src = shortcut.getAttribute('data-src');
		const name = shortcut.getAttribute('data-name');
		const img = shortcut.getAttribute('data-img');

		const app = new AppWindow(src, name, img);
	});
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


dockCheckbox.addEventListener('click', (e) => {
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


// Initial setup when Desktop is opened
(function init() {
	if (screen.width < 1024) {
		window.history.back();
	}

	new AppWindow('/console/applications/',
		'All applications',
		'/img/applications.svg'
	);
	if (Storage.getItem('desktop_help-viewed') !== 'true') {
		Storage.setItem('desktop_help-viewed', 'true');
		new AppWindow('/console/help/',
			'Welcome to My HR Desktop!'
		);
	}

	menuCheckbox.checked = Storage.getItem('desktop_hide-menu') === 'true';
	dockCheckbox.checked = Storage.getItem('desktop_hide-dock') === 'true';

	if (Storage.getItem('desktop_hide-menu') === 'true') {
		header.classList.add('auto-hide');
	}
	if (Storage.getItem('desktop_hide-dock') === 'true') {
		dock.classList.add('auto-hide');
	}
})()
