#!/bin/bash

HOSTNAME=`hostname -I`
PRESENT_DIR=`pwd`
LOGFILE="$PRESENT_DIR/.setup-navnirmitee.log"
touch $LOGFILE
echo "" > $LOGFILE
echo "Starting Tomcat installation"

sudo apt-get install tomcat7 >> $LOGFILE 2>&1
sudo service tomcat7 start>> $LOGFILE
RC=$?
if [ $RC == 3 ]
then
    echo "Error : Installing Tomcat Please Check... Logs : $LOGFILE"
    exit
fi

echo "Please visit : http://$HOSTNAME:8080"
echo "Press any key to continue..."

read

echo "Proceeding with nginx installation..."
SIGN_KEY="nginx_signing.key"
wget -O $SIGN_KEY http://nginx.org/keys/nginx_signing.key >> $LOGFILE 2>&1
if [ $RC != 0 ]
then
    echo "Error downloading nginx key.."
    echo "Please check your internet connection or Check Logs : $LOGFILE"
fi

sudo apt-key add $SIGN_KEY >> $LOGFILE 2>&1
UBUNTU_RELEASE=`lsb_release -sc`
NGINX_PACKAGE_REPO="deb http://nginx.org/packages/mainline/ubuntu/ $UBUNTU_RELEASE nginx"
NGINX_SRC_REPO="deb-src http://nginx.org/packages/mainline/ubuntu/ $UBUNTU_RELEASE nginx"

sudo apt-get update >> $LOGFILE 2>&1
sudo apt-get install nginx >> $LOGFILE 2>&1
nginx -v >> $LOGFILE 2>&1
RC=$?
if [ $RC != 0 ]
then
    echo "Error installing nginx ... Please check Log : $LOGFILE"
fi

sudo nginx -t

RC=$?
if [ $RC != 0 ]
then
    echo "Error installing nginx ... Please check Log : $LOGFILE"
fi

echo "Please visit http://$HOSTNAME"
echo "Press any key to continue..."

read

echo "Proceeding with proxy setup.."

sudo mv /etc/nginx/conf.d/navnirmitee.conf /etc/nginx/conf.d/navnirmitee.conf.backup >> $LOGFILE 2>&1

PROXY_CONF_FILE="navnirmitee.conf"
cat << END > "$PROXY_CONF_FILE"
server {
  listen 80;
  server_name example.com;
  location / {
     proxy_pass http://127.0.0.1:8080/;
  }
}
END
sudo mv navnirmitee.conf /etc/nginx/conf.d >> $LOGFILE 2>&1

sudo nginx -t >> $LOGFILE 2>&1

RC=$?
if [ $RC != 0 ]
then
    echo "Error configuring nginx ... Please check Log : $LOGFILE"
 
fi


sudo nginx -s reload >> $LOGFILE 2>&1
echo "Please visit http://$HOSTNAME"
echo "Press any key to continue..."

read
