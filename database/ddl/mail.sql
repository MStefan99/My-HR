create table mail (
	id      integer not null
		constraint mail_pk
			primary key autoincrement,
	address text    not null
);

create unique index mail_address_uindex
	on mail (address);

create unique index mail_id_uindex
	on mail (id);
