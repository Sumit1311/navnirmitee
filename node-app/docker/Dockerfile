FROM node:6.12

ENV SIGN_KEY="nginx_signing.key"

#Set proxy if required

ENV http_proxy="http://sumit_toshniwal:Time%401234@10.43.3.110:8080"
ENV https_proxy="https://sumit_toshniwal:Time%401234@10.43.3.110:8080"
RUN npm config set proxy "$http_proxy"
RUN npm config set https-proxy "$http_proxy"
RUN git config --global http.proxy "$http_proxy"
#RUN git config --global core.gitproxy 
RUN git config --global url.https://github.com/.insteadOf git://github.com/


WORKDIR /src/app

RUN apt-get update && \
apt-get install -y software-properties-common && \
apt-get install -y socat

RUN add-apt-repository "deb http://apt.postgresql.org/pub/repos/apt/ jessie-pgdg main" && \
wget -O - --quiet https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
apt-get update

RUN add-apt-repository "deb http://ftp.debian.org/debian jessie-backports main" && \
apt-get update

RUN apt-get install -y redis-server

RUN apt-get install -y postgresql-9.6

RUN apt-get install -y nginx

RUN apt-get install -y certbot -t jessie-backports

COPY . /src/app
RUN cp /src/app/ajabgajab.conf /etc/nginx/conf.d/ajabgajab.conf



#RUN /src/app/scripts/db-setup.sh
#RUN git config --global core.gitproxy /src/app/scripts/gitproxy.sh

RUN npm install

EXPOSE 80 443

ENTRYPOINT ["/src/app/docker/entrypoint.sh"]
