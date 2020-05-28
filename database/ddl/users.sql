create table users (
	id            integer not null
		constraint users_pk
			primary key autoincrement,
	username      text    not null,
	password_hash text,
	setup_code    text
);

create unique index users_id_uindex
	on users (id);

create unique index users_username_uindex
	on users (username);
