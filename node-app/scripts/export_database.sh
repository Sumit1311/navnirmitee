#!/bin/bash

DB_NAME=ajab_gajab
DEST_DIR=
FILE_NAME="$DB_NAME.dump"
ROOT_DIR=`date +%Y%m%d`

while getopts d:f: o
do
case "$o" in
d) DEST_DIR="$OPTARG";;
f) FILE_NAME="$OPTARG";;
esac
done

pg_dump -U $DB_USER $DB_NAME > "$DEST_DIR/$ROOT_DIR/$FILE_NAME"
