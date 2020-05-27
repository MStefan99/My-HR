create table sessions (
	id         integer not null
		constraint sessions_pk
			primary key autoincrement,
	uuid       text    not null,
	email      text    not null,
	ip         text    not null,
	created_at real    not null
);

create unique index sessions_email_uindex
	on sessions (email);

create unique index sessions_id_uindex
	on sessions (id);

create unique index sessions_uuid_uindex
	on sessions (uuid);

