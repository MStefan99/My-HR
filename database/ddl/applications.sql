create table applications (
	id           integer not null
		constraint applications_pk
			primary key autoincrement,
	first_name   text    not null,
	last_name    text    not null,
	email        text    not null,
	backup_email text    not null,
	phone        integer,
	team         text    not null,
	file         text    not null
);

create unique index applications_email_uindex
	on applications (email, backup_email);

create unique index applications_file_uindex
	on applications (file);

create unique index applications_id_uindex
	on applications (id);

create unique index applications_phone_uindex
	on applications (phone);

