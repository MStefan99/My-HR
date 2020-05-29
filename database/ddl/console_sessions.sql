create table console_sessions (
	id      integer not null
		constraint console_sessions_pk
			primary key autoincrement,
	uuid    text    not null,
	user_id integer not null
		references console_users,
	ip      text    not null,
	ua      text    not null,
	time    real    not null
);

create unique index console_sessions_id_uindex
	on console_sessions (id);

create unique index console_sessions_uuid_uindex
	on console_sessions (uuid);
