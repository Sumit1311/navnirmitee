sudo certbot certonly --force-renew --webroot -w /var/www/ajab-gajab.com/ -d ajab-gajab.com -d www.ajab-gajab.com -d kidslibrary.ajab-gajab.com -d www.kidslibrary.ajab-gajab.com
sudo service nginx restart
