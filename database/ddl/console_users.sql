create table console_users (
	id            integer not null
		constraint users_pk
			primary key autoincrement,
	username      text    not null,
	uuid          text    not null,
	admin         integer not null default 0,
	setup_code    text,
	password_hash text,
	secret        text
);

create unique index users_id_uindex
	on console_users (id);

create unique index users_username_uindex
	on console_users (username);
