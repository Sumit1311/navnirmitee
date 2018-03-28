CREATE TABLE IF NOT EXISTS nav_user( _id varchar(36) NOT NULL, first_name text, last_name text, email_address varchar(100), mobile_no varchar(15), password text, email_verification VARCHAR(36), subscribed_plan VARCHAR(10), points integer,balance integer DEFAULT 0, deposit integer DEFAULT 0, address text, city varchar(50), state varchar(30), membership_expiry bigint, enrollment_date bigint, pin_code VARCHAR(10), user_type smallint, reset_password VARCHAR(36), CONSTRAINT nav_user_id_pk PRIMARY KEY (_id));
       
CREATE TABLE IF NOT EXISTS nav_child (_id varchar(36), age_group smallint, hobbies TEXT, user_id VARCHAR(36), gender smallint,  CONSTRAINT nav_child_id PRIMARY KEY (_id), CONSTRAINT nav_child_id_user_id_fk FOREIGN KEY (user_id) REFERENCES nav_user(_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE);
        
        
CREATE TABLE IF NOT EXISTS nav_toys (_id varchar(36), name varchar(50), stock integer, price integer, short_description VARCHAR(100), long_description TEXT, points integer, age_group smallint, parent_toys_id varchar(36), rent_duration integer, brand integer, category smallint, deposit integer, popular boolean DEFAULT false, CONSTRAINT nav_toys_id_pk PRIMARY KEY (_id), CONSTRAINT nav_toys_parent_toys_id_fk FOREIGN KEY (parent_toys_id) REFERENCES  nav_toys (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE);
        
       
CREATE TABLE IF NOT EXISTS nav_rentals( _id VARCHAR(36), user_id varchar(36), toys_id varchar(36), transaction_date bigint, lease_start_date bigint, lease_end_date bigint, shipping_address TEXT, status VARCHAR(30), delivery_date bigint, returned_date bigint, release_date bigint, CONSTRAINT nav_rental_id_pk PRIMARY KEY (_id),CONSTRAINT nav_rentals_toys_id_fk FOREIGN KEY (toys_id) REFERENCES  nav_toys (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE,CONSTRAINT nav_rentals_user_id_fk FOREIGN KEY (user_id) REFERENCES  nav_user (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE);
        
       
CREATE TABLE IF NOT EXISTS nav_toys_skills( _id varchar(36), toys_id varchar(36), skill integer, CONSTRAINT nav_toys_skills_id_pk PRIMARY KEY (_id), CONSTRAINT nav_toys_skills_id_fk FOREIGN KEY (toys_id) REFERENCES  nav_toys (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE);
        
       
CREATE TABLE IF NOT EXISTS  nav_payments(_id varchar(36), user_id varchar(36), amount_payable integer, reason VARCHAR(30), credit_date bigint, paid_date bigint, status VARCHAR(30),transaction_id VARCHAR(36), transaction_summary TEXT, next_retry_date bigint, expiration_date bigint, transaction_type VARCHAR(20), is_order smallint, CONSTRAINT nav_payments_id_pk PRIMARY KEY (_id),CONSTRAINT nav_payments_user_id_fk FOREIGN KEY (user_id) REFERENCES  nav_user (_id) MATCH FULL ON DELETE CASCADE ON UPDATE CASCADE NOT DEFERRABLE);
        
       
CREATE TABLE IF NOT EXISTS  nav_enquiry(_id varchar(36), name varchar(50), email varchar(50), contact_no VARCHAR(15), message varchar(500), submission_date bigint, CONSTRAINT nav_enquiry_id_pk PRIMARY KEY (_id));
        

