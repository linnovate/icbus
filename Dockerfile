FROM node:4.3-wheezy

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g mean-cli bower gulp

RUN	groupadd -r node \
&&	useradd -r -m -g node node

COPY . /usr/src/app/
RUN rm -rf /usr/src/app/node_modules
RUN chown -R node:node /usr/src/app

USER node
RUN touch /home/node/.mean
RUN npm install 
ENV PORT 3002  
ENV DB_PORT_27017_TCP_ADDR db
CMD [ "npm", "start" ]
EXPOSE 3002


#How to build:
# git clone https://github.com/linnovate/mean
# cd mean
# docker build -t mean .

#How to run:
# docker pull mongo
# docker run -d --name db mongo
# docker run -p 3002:3002 --link db:db mean
