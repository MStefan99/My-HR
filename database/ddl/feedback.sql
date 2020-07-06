create table feedback (
	id      integer not null
		constraint feedback_pk
			primary key autoincrement,
	name    text,
	email   text,
	message text    not null
);