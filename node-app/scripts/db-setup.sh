#!/bin/sh


su postgres -c "psql -c \"CREATE DATABASE \"$DB_NAME\"\""
su postgres -c "psql -c \"CREATE USER $DB_USER WITH LOGIN PASSWORD '$DB_PASS'\""
export PGPASSWORD=$DB_PASS
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d "$DB_NAME" -f data/ajab-gajab_create.sql
//psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d "$DB_NAME" -f data/final_toy_script.sql
