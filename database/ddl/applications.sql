create table applications (
	id           integer not null
		constraint applications_pk
			primary key autoincrement,
	first_name   text    not null,
	last_name    text    not null,
	email        text    not null,
	backup_email text    not null,
	phone        text    not null,
	backup_phone text,
	team         text    not null,
	links        text,
	free_form    text,
	file_name    text    not null,
	file_path    text    not null,
	accepted     integer not null default 0
);

create unique index applications_file_path_uindex
	on applications (file_path);

create unique index applications_id_uindex
	on applications (id);

