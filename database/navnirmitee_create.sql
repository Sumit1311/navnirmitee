/* Database generated with pgModeler (PostgreSQL Database Modeler).
  Project Site: pgmodeler.com.br
  Model Author: --- */


/* Database creation must be done outside an multicommand file.
   These commands were put in this file only for convenience.

-- object: navnirmitee | type: DATABASE -- 
CREATE DATABASE navnirmitee
	ENCODING = 'UTF8'
;

*/

-- object:  nav_user | type: TABLE -- 
CREATE TABLE  nav_user(
	_id varchar(36) NOT NULL,
	first_name text,
	last_name text,
	email_address varchar(30),
	mobile_no varchar(15),
	password text,
	emai_verification smallint,
	address text,
	city varchar(50),
	state varchar(30),
	is_active smallint,
	CONSTRAINT nav_user_id_pk PRIMARY KEY (_id)
)
WITH (OIDS=FALSE);

-- object:  nav_toys | type: TABLE -- 
CREATE TABLE  nav_toys(
	_id varchar(36),
	name varchar(50),
	stock integer,
	price varchar(20),
	points integer,
	age_group smallint,
	category smallint,
	parent_toys_id varchar(36),
	CONSTRAINT _id PRIMARY KEY (_id)
)
WITH (OIDS=FALSE);

-- object:  nav_rentals | type: TABLE -- 
CREATE TABLE  nav_rentals(
	user_id varchar(36),
	toys_id varchar(36),
	lease_start_date bigint,
	lease_end_date bigint,
	CONSTRAINT nav_rental_id_pk PRIMARY KEY (user_id,toys_id)
)
WITH (OIDS=FALSE);

-- object:  nav_payments | type: TABLE -- 
CREATE TABLE  nav_payments(
	_id varchar(36),
	last_payment_date bigint,
	user_id varchar(36),
	balance_points integer,
	balance_amount integer,
	CONSTRAINT nav_payments_id PRIMARY KEY (_id)
)
WITH (OIDS=FALSE);

-- object: nav_payments_user_id | type: CONSTRAINT -- 
ALTER TABLE  nav_payments ADD CONSTRAINT nav_payments_user_id FOREIGN KEY (user_id)
REFERENCES  nav_user (_id) MATCH FULL
ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE;

-- object: nav_rentals_toys_id_fk | type: CONSTRAINT -- 
ALTER TABLE  nav_rentals ADD CONSTRAINT nav_rentals_toys_id_fk FOREIGN KEY (toys_id)
REFERENCES  nav_toys (_id) MATCH FULL
ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE;

-- object: nav_rentals_user_id_fk | type: CONSTRAINT -- 
ALTER TABLE  nav_rentals ADD CONSTRAINT nav_rentals_user_id_fk FOREIGN KEY (user_id)
REFERENCES  nav_user (_id) MATCH FULL
ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE;

-- object: nav_toys_parent_toys_id_fk | type: CONSTRAINT -- 
ALTER TABLE  nav_toys ADD CONSTRAINT nav_toys_parent_toys_id_fk FOREIGN KEY (parent_toys_id)
REFERENCES  nav_toys (_id) MATCH FULL
ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE;


