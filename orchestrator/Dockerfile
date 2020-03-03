FROM node:alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json .

COPY . .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Tweak npm to work around SRK's https proxying and install the deps.
RUN npm config set strict-ssl false \
    && NODE_TLS_REJECT_UNAUTHORIZED=0 npm i

EXPOSE 3000

CMD npm start