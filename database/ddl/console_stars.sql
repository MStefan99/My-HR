create table console_stars (
	id             integer not null
		constraint console_favorites_pk
			primary key autoincrement,
	user_id        integer not null
		constraint console_favorites_console_users_id_fk
			references console_users
			on update cascade on delete cascade,
	application_id integer not null
		constraint console_favorites_applications_id_fk
			references applications
			on update cascade on delete cascade
);

create unique index console_favorites_id_uindex
	on console_stars (id);

create unique index ids_uindex
	on console_stars (user_id, application_id);

