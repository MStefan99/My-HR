const header = document.querySelector('header');
const main = document.querySelector('main');
const dock = document.querySelector('#dock');
const shortcuts = document.querySelectorAll('footer .dock-shortcut');
const apps = [];

let appLeft = 50;
let appTop = 50;


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
	left = appLeft + 20;
	top = appTop + 20;
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


	constructor(src, name, img) {
		this.src = src;
		this.name = name;
		this.img = img;

		appLeft += 20;
		appTop += 20;

		// Creating app window
		this.window = document.createElement('div');
		this.window.classList.add('app-window', 'hidden');
		this.window.style.left = this.left + 'px';
		this.window.style.top = this.top + 'px';
		this.window.addEventListener('mousedown', () => pushToFront(this));
		pushToFront(this);

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
		this.shortcut.appendChild(icon);
		dock.appendChild(this.shortcut);
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

		// Adding created app to DOM
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

		// Adding created app to app list
		apps.push(this);
	}


	drag(e) {
		this.left += e.movementX;
		this.top += e.movementY;
		this.top = Math.max(this.top, 30);

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
		remove(this.shortcut);
		setTimeout(() => {
			remove(this.window);
		}, 1000);
	}


	home() {
		this.iframe.src = this.src;
	}


	refresh() {
		this.iframe.contentWindow.location.reload();
	}
}


if (screen.width < 1024) {
	window.history.back();
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


shortcuts.forEach((shortcut) => {
	shortcut.addEventListener('click', () => {
		const src = shortcut.getAttribute('data-src');
		const name = shortcut.getAttribute('data-name');
		const img = shortcut.getAttribute('data-img');

		const app = new AppWindow(src, name, img);
		setTimeout(() => {
			app.window.classList.remove('hidden');
		}, 10);
	});
});


addEventListener('mousemove', () => {
	for (const app of apps) {
		app.header.removeEventListener('mousemove', app.dragHandler);
	}
});
