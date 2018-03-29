#!/bin/bash


cp /etc/postgresql/9.6/main/pg_hba.conf /etc/postgresql/9.6/main/pg_hba.conf.back
sed -i 's/^host *all *all *127.0.0.1\/32 *md5/host all all 0.0.0.0\/0 password/' /etc/postgresql/9.6/main/pg_hba.conf
service nginx start
nginx -s
service redis-server start
service postgresql start
source "scripts/environment_setup"
source "scripts/db-setup.sh"
#echo "$PORT"
export APP_DIR="/src/app"
(crontab -l ; echo "57 04 20 2,5,8,11 * /src/app/scripts/cert-autorenewal.sh") | sort - | uniq - | crontab -
. scripts/web-server-ctl.sh start
#certbot certonly --webroot -w /var/www/ajab-gajab.com/ -d ajab-gajab.com -d www.ajab-gajab.com -d kidslibrary.ajab-gajab.com -d www.kidslibrary.ajab-gajab.com
#service nginx stop
#service nginx start

