create table console_proposals (
	id             integer not null
		constraint console_proposals_pk
			primary key autoincrement,
	user_id        integer not null
		constraint console_proposals_console_users_id_fk
			references console_users
			on update cascade on delete cascade,
	application_id integer not null
		constraint console_proposals_applications_id_fk
			references applications
			on update cascade on delete cascade,
	status integer not null
);

create unique index console_proposals_user_id_application_id_uindex
	on console_proposals (user_id, application_id);
