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
	email_verification VARCHAR(36),
    subscribed_plan VARCHAR(10),
    points integer,
    balance integer,
    deposit integer,
	address text,
	city varchar(50),
	state varchar(30),
	membership_expiry bigint,
	CONSTRAINT nav_user_id_pk PRIMARY KEY (_id)
)
WITH (OIDS=FALSE);

-- object:  nav_toys | type: TABLE -- 
CREATE TABLE  nav_toys(
	_id varchar(36),
	name varchar(50),
	stock integer,
	price varchar(20),
    short_description varchar(100),
    long_description TEXT,
	points integer,
	age_group smallint,
	category smallint,
	parent_toys_id varchar(36),
	CONSTRAINT _id PRIMARY KEY (_id)
)
WITH (OIDS=FALSE);

-- object:  nav_rentals | type: TABLE -- 
CREATE TABLE  nav_rentals(
    _id varchar(36),
	user_id varchar(36),
	toys_id varchar(36),
    shipping_address TEXT,
    transaction_date bigint,
	lease_start_date bigint,
	lease_end_date bigint,
    status VARCHAR(30),
    delivery_date bigint,
    returned_date bigint,
	CONSTRAINT nav_rentals_id_pk PRIMARY KEY (_id)
)
WITH (OIDS=FALSE);

-- object:  nav_payments | type: TABLE -- 
CREATE TABLE  nav_payments(
	_id varchar(36),
	user_id varchar(36),
    amount_payable integer,
    reason VARCHAR(10),
    credit_date bigint,
    paid_date bigint,
    status VARCHAR(10),
	transaction_id varchar(36),
	transaction_summary TEXT,
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


