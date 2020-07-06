create table console_notes (
	id             integer not null
		constraint console_notes_pk
			primary key autoincrement,
	user_id        integer not null
		constraint console_notes_console_users_id_fk
			references console_users
			on update cascade on delete cascade,
	application_id integer
		constraint console_notes_console_applications_id_fk
			references applications
			on update cascade on delete cascade,
	shared         integer default 1 not null,
	message        text    not null
);


create unique index console_notes_id_uindex
	on console_notes (id);
