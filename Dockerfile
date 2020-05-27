FROM ubuntu:latest

RUN apt-get update && apt-get upgrade -y && apt-get install curl sqlite3 -y
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install nodejs -y

COPY ./ /var/www/html/
COPY setup/your-hr.service /etc/systemd/system/
COPY setup/ssl /var/www/html/cert/

EXPOSE 3000

#Not supported in WSL
#ENTRYPOINT service hr start && tail -F .

#ENTRYPOINT node /var/www/html/app.js && tail -F .
