main = document.querySelector('main');
shortcuts = document.querySelectorAll('footer .dock-shortcut');
const apps = [];

let appLeft = 50;
let appTop = 50;


function pushToFront(app) {
	console.log('pushing to front');
	for (const app of apps) {
		app.window.style['z-index'] = 0;
	}
	app.window.style['z-index'] = 1;
}


remove = function (element) {
	return element.parentNode.removeChild(element);
};



class AppWindow {
	maximized = false;
	src;
	name;
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


	constructor(src, name) {
		this.src = src;
		this.name = name;

		appLeft += 20;
		appTop += 20;

		this.window = document.createElement('div');
		this.window.classList.add('app-window');
		this.window.style.left = this.left + 'px';
		this.window.style.top = this.top + 'px';
		pushToFront(this);

		this.window.addEventListener('mousedown', () => pushToFront(this));

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

		this.header = document.createElement('div');
		this.header.classList.add('header');
		this.title = document.createElement('div');
		this.title.classList.add('title');

		this.title.innerHTML = name;

		this.windowIconGroup = document.createElement('div');
		this.windowIconGroup.classList.add('icon-group');
		this.minimizeIcon = document.createElement('div');
		this.minimizeIcon.classList.add('icon', 'minimize-icon');
		this.maximizeIcon = document.createElement('div');
		this.maximizeIcon.classList.add('icon', 'maximize-icon');
		this.closeIcon = document.createElement('div');
		this.closeIcon.classList.add('icon', 'close-icon');

		this.dragHandler = e => this.drag.bind(this)(e);

		this.header.addEventListener('mousedown', () => {
			this.header.addEventListener('mousemove', this.dragHandler);
		});
		this.header.addEventListener('mouseup', () => {
			this.header.removeEventListener('mousemove', this.dragHandler);
		});
		this.header.addEventListener('mousemove', e => e.stopPropagation());

		this.closeIcon.addEventListener('click', () => this.close());
		this.maximizeIcon.addEventListener('click', () => this.maximize());
		this.maximizeIcon.addEventListener('click', () => this.maximize());

		this.content = document.createElement('div');
		this.content.classList.add('content');
		this.iframe = document.createElement('iframe');
		this.iframe.src = src;

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

		this.iframe.addEventListener('load', () => {
			modifyAppStyle(this.iframe.contentDocument);
		});
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

	maximize() {
		if (this.maximized) {
			console.log('Maximized');
		}
		this.maximized = !this.maximized;
	}

	close() {
		[this.window, this.header, this.title,
			this.windowIconGroup, this.closeIcon, this.minimizeIcon,
			this.maximizeIcon, this.content, this.iframe]
			.forEach(function (e) {
				remove(e);
			});
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

	iframeHeader.style.display = 'none';
	iframeFooter.style.display = 'none';

	iframeBody.style.background = '#ffffff33';
	iframeMain.style.background = 'none';
	iframeMain.style.margin = '0';
};


shortcuts.forEach((shortcut) => {
	shortcut.addEventListener('click', () => {
		const src = shortcut.getAttribute('data-src');
		const name = shortcut.getAttribute('data-name');

		console.log(new AppWindow(src, name));
	});
});


addEventListener('mousemove', () => {
	for (const app of apps) {
		app.header.removeEventListener('mousemove', app.dragHandler);
	}
});


addEventListener('beforeunload', (e) => {
	e.preventDefault();
	e.returnValue = '';
});
